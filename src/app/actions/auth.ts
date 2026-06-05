'use server';

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  clearAuthSession,
  getCallerSession,
  hasPortalSession,
  setCallerSession,
  setPortalSession,
  type CallerRole,
} from '@/lib/auth-session';

const PIN_HASH_PREFIX = 'scrypt';
const PIN_HASH_BYTES = 32;

function requireSupabase() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('DATABASE_NOT_CONFIGURED');
  return supabase;
}

function safeStringEqual(expected: string, supplied: string) {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const suppliedBuffer = Buffer.from(supplied, 'utf8');
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function hashCallerPin(pin: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pin, salt, PIN_HASH_BYTES).toString('hex');
  return `${PIN_HASH_PREFIX}$${salt}$${hash}`;
}

function verifyCallerPin(storedPin: string, suppliedPin: string) {
  if (!storedPin.startsWith(`${PIN_HASH_PREFIX}$`)) {
    return storedPin === suppliedPin;
  }

  const [, salt, expectedHex] = storedPin.split('$');
  if (!salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = scryptSync(suppliedPin, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function getCallerProfiles() {
  try {
    if (!(await hasPortalSession())) throw new Error('UNAUTHORIZED');
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('caller_profiles')
      .select('id, name, gender, role, daily_call_target, weekly_appointment_target, status, disabled_reason, created_at')
      .neq('name', '__portal_settings__');
    if (error) throw new Error(error.message);
    return { success: true, profiles: data || [] };
  } catch (error: any) {
    console.error('[getCallerProfiles]', error.message);
    return { success: false, error: error.message, profiles: [] };
  }
}

export async function verifyCallerPinAction(name: string, pin: string) {
  try {
    if (!(await hasPortalSession())) throw new Error('UNAUTHORIZED');
    const supabase = requireSupabase();
    
    const { data, error } = await supabase
      .from('caller_profiles')
      .select('pin, role, trust_level, agreement_accepted_version, status, disabled_reason')
      .eq('name', name)
      .single();
      
    if (!error && data) {
      if (data.status === 'Disabled') {
        return { success: false, error: 'ACCOUNT_SUSPENDED', disabledReason: data.disabled_reason || 'Account disabled by admin compliance.' };
      }
      if (verifyCallerPin(data.pin, pin)) {
        if (!data.pin.startsWith(`${PIN_HASH_PREFIX}$`)) {
          await supabase
            .from('caller_profiles')
            .update({ pin: hashCallerPin(pin) })
            .eq('name', name);
        }
        const role = (data.role || 'Caller') as CallerRole;
        const trustLevel = data.trust_level || 'New';
        const agreementVersion = data.agreement_accepted_version || null;
        await setCallerSession(name, role, trustLevel, agreementVersion);
        return { success: true, role, agreementAcceptedVersion: agreementVersion };
      }
      
      // Fallback: if stored pin is the dummy "000000" but user supplies correct env-configured PIN
      if (verifyCallerPin(data.pin, '000000')) {
        let expectedPin = '';
        let role = 'Caller';
        if (name === 'Hamid') {
          expectedPin = (process.env.HAMID_PIN || '').trim();
          role = 'Admin';
        } else if (name === 'Oussama') {
          expectedPin = (process.env.OUSSAMA_PIN || '').trim();
          role = 'Caller';
        } else if (name === 'Kamel') {
          expectedPin = (process.env.KAMEL_PIN || '').trim();
          role = 'Caller';
        } else if (name === 'Yacine') {
          expectedPin = (process.env.YACINE_PIN || '').trim();
          role = 'Supervisor';
        } else if (name === 'Sofiane') {
          expectedPin = (process.env.SOFIANE_PIN || '').trim();
          role = 'Viewer';
        }

        if (expectedPin !== '' && safeStringEqual(expectedPin, pin)) {
          await supabase
            .from('caller_profiles')
            .update({ pin: hashCallerPin(pin) })
            .eq('name', name);
          const finalRole = (data.role || role) as CallerRole;
          await setCallerSession(name, finalRole);
          return { success: true, role: finalRole };
        }
      }
      
      return { success: false };
    }
    
    let expectedPin = '';
    let role = 'Caller';
    if (name === 'Hamid') {
      expectedPin = (process.env.HAMID_PIN || '').replace(/[^0-9]/g, '');
      role = 'Admin';
    } else if (name === 'Oussama') {
      expectedPin = (process.env.OUSSAMA_PIN || '').replace(/[^0-9]/g, '');
      role = 'Caller';
    } else if (name === 'Kamel') {
      expectedPin = (process.env.KAMEL_PIN || '').replace(/[^0-9]/g, '');
      role = 'Caller';
    } else if (name === 'Yacine') {
      expectedPin = (process.env.YACINE_PIN || '').trim();
      role = 'Supervisor';
    } else if (name === 'Sofiane') {
      expectedPin = (process.env.SOFIANE_PIN || '').trim();
      role = 'Viewer';
    }
    
    const matched = expectedPin !== '' && safeStringEqual(expectedPin, pin);
    if (matched) await setCallerSession(name, role as CallerRole, 'New', null);
    return { success: matched, role: matched ? role : undefined, agreementAcceptedVersion: matched ? null : undefined };
  } catch (error: any) {
    console.error('[verifyCallerPinAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function verifyPortalPinAction(pin: string) {
  try {
    const supabase = requireSupabase();
    const { data: customPinObj } = await supabase
      .from('caller_profiles')
      .select('pin')
      .eq('name', '__portal_settings__')
      .single();

    if (customPinObj && customPinObj.pin && customPinObj.pin !== '000000') {
      const success = verifyCallerPin(customPinObj.pin, pin);
      if (success) {
        await setPortalSession();
        return { success: true };
      }
      
      // Fallback: if stored pin is the dummy "000000" but user supplies correct env-configured PIN
      if (verifyCallerPin(customPinObj.pin, '000000')) {
        const expectedPortalPin = (process.env.PORTAL_PIN || '').trim();
        if (expectedPortalPin && safeStringEqual(expectedPortalPin, pin)) {
          await supabase
            .from('caller_profiles')
            .update({ pin: hashCallerPin(pin) })
            .eq('name', '__portal_settings__');
          await setPortalSession();
          return { success: true };
        }
      }
      
      return { success: false };
    } else {
      const expectedPortalPin = (process.env.PORTAL_PIN || '').replace(/[^0-9]/g, '');
      if (!expectedPortalPin) throw new Error('PORTAL_PIN_NOT_CONFIGURED');
      const success = safeStringEqual(expectedPortalPin, pin);
      if (success) await setPortalSession();
      return { success };
    }
  } catch (error: any) {
    console.error('[verifyPortalPinAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function getCurrentSessionAction() {
  try {
    const portalUnlocked = await hasPortalSession();
    const caller = await getCallerSession();
    const supabase = requireSupabase();

    const { data: settings } = await supabase
      .from('caller_profiles')
      .select('guidelines_version, guidelines_text')
      .eq('name', '__portal_settings__')
      .maybeSingle();

    return {
      success: true,
      portalUnlocked,
      callerName: caller?.name || '',
      callerRole: caller?.role || 'Caller',
      agreementAcceptedVersion: caller?.agreement_accepted_version || null,
      latestGuidelinesVersion: settings?.guidelines_version || '1.0',
      latestGuidelinesText: settings?.guidelines_text || '',
      trustLevel: caller?.trust_level || 'New',
    };
  } catch (error: any) {
    return { success: false, portalUnlocked: false, callerName: '', callerRole: 'Caller', error: error.message };
  }
}

export async function logoutAction() {
  await clearAuthSession();
  return { success: true };
}

export async function submitTeamApplication(
  name: string,
  email: string,
  phone: string,
  gender: string,
  telegram?: string,
  experience?: string,
  hours?: string
) {
  try {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/[^0-9+]/g, '');
    const cleanTelegram = (telegram || '').trim().replace(/^@/, '');
    const cleanExperience = (experience || '').trim();
    const cleanHours = (hours || '').trim();
    const normalizedGender = gender.trim();

    if (normalizedName.length < 2 || normalizedName.length > 100) throw new Error('INVALID_NAME');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('INVALID_EMAIL_FORMAT');
    if (cleanPhone.length < 6 || cleanPhone.length > 15) throw new Error('INVALID_PHONE');
    if (!['Male', 'Female', 'Other'].includes(normalizedGender)) throw new Error('INVALID_GENDER');

    // Pack details into phone column (restricted to VARCHAR(50))
    // Format: [phone]|TG:[telegram]|E:[experience]|H:[hours]
    const packedParts = [
      cleanPhone,
      cleanTelegram ? `TG:${cleanTelegram}` : '',
      cleanExperience ? `E:${cleanExperience}` : '',
      cleanHours ? `H:${cleanHours}` : ''
    ].filter(Boolean);

    const packedPhone = packedParts.join('|');
    if (packedPhone.length > 50) {
      throw new Error('APPLICATION_DATA_TOO_LONG');
    }

    const supabase = requireSupabase();
    const { data: existing, error: existingError } = await supabase
      .from('team_applications')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('status', 'Pending')
      .limit(1);
    if (existingError) throw new Error(existingError.message);
    if (existing?.length) return { success: true };

    const { error } = await supabase.from('team_applications').insert({
      name: normalizedName,
      email: normalizedEmail,
      phone: packedPhone,
      gender: normalizedGender,
      status: 'Pending'
    });
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error: any) {
    console.error('[submitTeamApplication]', error.message);
    return { success: false, error: error.message };
  }
}

export async function acceptCallerAgreementAction(name: string) {
  try {
    const supabase = requireSupabase();

    // Fetch the latest guidelines version
    const { data: settings } = await supabase
      .from('caller_profiles')
      .select('guidelines_version')
      .eq('name', '__portal_settings__')
      .maybeSingle();

    const latestVersion = settings?.guidelines_version || '1.0';
    
    // Update caller profile with the latest version
    const { error: profileError } = await supabase
      .from('caller_profiles')
      .update({ agreement_accepted_version: latestVersion })
      .eq('name', name);
      
    if (profileError) throw new Error(profileError.message);

    // Get updated profile details to refresh session token
    const { data: profile } = await supabase
      .from('caller_profiles')
      .select('role, trust_level, agreement_accepted_version')
      .eq('name', name)
      .single();

    if (profile) {
      await setCallerSession(name, profile.role, profile.trust_level, profile.agreement_accepted_version);
    }

    // Log to audit log table
    await supabase.from('audit_logs').insert({
      caller_name: name,
      action_type: `ACCEPT_AGREEMENT_V${latestVersion}`,
      details: `Guidelines and Commission Agreement version ${latestVersion} accepted.`,
      lead_id: null
    });

    return { success: true, acceptedVersion: latestVersion };
  } catch (error: any) {
    console.error('[acceptCallerAgreementAction]', error.message);
    return { success: false, error: error.message };
  }
}

export async function startDemoSessionAction() {
  try {
    // Set a caller session for "Demo Caller"
    // Trusted level "New", accepts latest Guidelines automatically for the demo context
    await setCallerSession('Demo Caller', 'Caller', 'New', '1.0');
    return { success: true };
  } catch (error: any) {
    console.error('[startDemoSessionAction]', error.message);
    return { success: false, error: error.message };
  }
}
