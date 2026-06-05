import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface TermsOfUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfUseModal: React.FC<TermsOfUseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sections = [
    {
      num: 1,
      title: "Purpose",
      content: "These Terms of Use explain the rules that every caller must accept before working with WEB-OS. The goal is to make the collaboration clear, fair, and professional. By accepting these terms, the caller confirms that they understand how their work is tracked, how leads are owned, how commissions are calculated, when commissions are paid, what they are allowed to say to clients, what they are not allowed to do, and how client data and WEB-OS data must be protected."
    },
    {
      num: 2,
      title: "Caller Role",
      content: "The caller’s role is to contact assigned prospects, create interest, qualify potential clients, book calls or meetings, and log all activity inside the WEB-OS CRM dashboard. At the beginning, the caller is not a full sales manager and is not allowed to close full deals alone unless WEB-OS gives written permission."
    },
    {
      num: 3,
      title: "Commission-Based Work",
      content: "This is commission-based work. The caller is paid only when a client brought through the correct WEB-OS process pays WEB-OS. The caller does not receive payment for calling leads only, sending messages only, a client saying 'I am interested', a meeting being booked, or a client saying they will pay later."
    },
    {
      num: 4,
      title: "Commission Rates",
      content: "The standard commission structure is: 20% for a valid paying client brought through the correct process; 25% for a strong qualified lead where the caller follows up seriously and helps move the deal forward; 30% only when the caller brings the client, follows the full process, helps close the deal properly, and the final price and scope are approved by WEB-OS."
    },
    {
      num: 5,
      title: "Commission Calculated From Received Money Only",
      content: "Commission is calculated only from money actually received by WEB-OS. If the client pays in parts, the caller is paid in parts. If the client never pays the remaining amount, the caller does not receive commission on money WEB-OS did not receive."
    },
    {
      num: 6,
      title: "Commission Payment Timing",
      content: "Commission becomes pending after WEB-OS confirms client payment. WEB-OS aims to pay valid caller commissions within 48 hours after payment confirmation when possible. Delay may occur if payment is disputed, refunded, or dashboard records are incomplete."
    },
    {
      num: 7,
      title: "What Counts as a Closed Deal",
      content: "A deal is closed only when the client pays WEB-OS (deposit, milestone, or full payment) and the payment is confirmed and registered correctly in the dashboard."
    },
    {
      num: 8,
      title: "Lead Ownership",
      content: "A caller owns a lead only when the lead is properly registered in the dashboard with a business name, contact info, date/time, call/message outcome, and detailed notes."
    },
    {
      num: 9,
      title: "Ownership Protection Period",
      content: "A valid owned lead is protected for the caller for 60 days. If the caller does not follow up, update, or take action on the lead for 14 days, WEB-OS may review, reassign, or remove the caller’s ownership."
    },
    {
      num: 10,
      title: "No Dashboard Record, No Guaranteed Commission",
      content: "The dashboard is the official source of truth. If a caller claims they brought a client but the lead was not recorded in the dashboard, WEB-OS cannot guarantee commission."
    },
    {
      num: 11,
      title: "Duplicate Leads",
      content: "If two callers contact the same business, the first caller who registered a valid lead in the dashboard owns the lead. WEB-OS may split commission (e.g. 70/30 or 50/50) in special cases if both callers contributed strongly."
    },
    {
      num: 12,
      title: "Dashboard Use Is Mandatory",
      content: "The caller must use the WEB-OS dashboard for all work, logging calls, messages, client responses, interested leads, follow-ups, and notes. Working outside the dashboard or hiding leads is a policy violation."
    },
    {
      num: 13,
      title: "Required Call Notes",
      content: "Every important interaction must include useful notes detailing the business status, interest, next steps, and callback times. Vague notes like 'Called' or 'Interested' are insufficient."
    },
    {
      num: 14,
      title: "What the Caller Is Allowed to Say",
      content: "The caller may explain the general WEB-OS offer, highlighting professional websites, mobile-friendly design, direct WhatsApp contact, Google Maps, and social media integration."
    },
    {
      num: 15,
      title: "What the Caller Is Not Allowed to Promise",
      content: "The caller must not promise final prices, exact delivery dates, free maintenance, unlimited revisions/pages, free future features, booking systems, mobile apps, or ranking guarantees without explicit written approval."
    },
    {
      num: 16,
      title: "Final Price and Scope Approval",
      content: "Only WEB-OS management can approve final prices, project scopes, payment plans, delivery estimates, revisions, and discounts."
    },
    {
      num: 17,
      title: "Client Payment Rules",
      content: "The caller must never collect money personally from the client. All client payments must go directly to WEB-OS. Attempting to collect money privately is a serious compliance breach."
    },
    {
      num: 18,
      title: "WEB-OS Website Packages",
      content: "Website prices generally range from 20,000 DZD (Starter), 45,000 to 70,000 DZD (Professional), up to 100,000 DZD or more (Premium) depending on complexity."
    },
    {
      num: 19,
      title: "No Free Maintenance",
      content: "WEB-OS does not include free long-term maintenance. After project delivery, any new feature, new page, or redesign is paid separately unless written in the client agreement."
    },
    {
      num: 20,
      title: "Extra Work Is Paid",
      content: "Clients receive only what is written in the agreement. Additional pages, sections, languages, logos, admin panels, or integrations are billed extra."
    },
    {
      num: 21,
      title: "Revisions",
      content: "Limited revision rounds are included based on the package (Starter: 1 round, Professional: 2 rounds, Premium: 2-3 rounds). Revisions adjust agreed work but do not add new features."
    },
    {
      num: 22,
      title: "Delivery Time",
      content: "Approximate delivery ranges from 3-5 days (Starter) to 10-20 days (Premium). These are estimates and depend on the client sending content on time."
    },
    {
      num: 23,
      title: "Client Content Responsibility",
      content: "Clients are responsible for providing their logo, images, text, maps, and social links. Delays in sending content will extend delivery times."
    },
    {
      num: 24,
      title: "Confidentiality",
      content: "All WEB-OS leads, contact details, scripts, notes, dashboard data, and internal strategies are confidential. Callers must not copy, export, share, or use these details for personal purposes."
    },
    {
      num: 25,
      title: "Lead Protection and Non-Circumvention",
      content: "Callers must not bypass WEB-OS. Contacting leads privately or offering personal services to WEB-OS leads is strictly forbidden and will result in removal and cancellation of pending commissions."
    },
    {
      num: 26,
      title: "Client Data Handling",
      content: "Caller must handle client data securely, using it only for authorized WEB-OS work and keeping all data within the CRM dashboard."
    },
    {
      num: 27,
      title: "Do Not Contact Rule",
      content: "If a lead requests not to be contacted again, they must be marked 'Do Not Contact' in the dashboard, and no caller may contact them again without management approval."
    },
    {
      num: 28,
      title: "Professional Behavior",
      content: "Callers must remain respectful, honest, calm, and follow approved scripts. Lying, insults, fake identities, pressure, or spam are strictly prohibited."
    },
    {
      num: 29,
      title: "Disputes",
      content: "Ownership or commission disputes will be reviewed based on dashboard history, log records, and timestamps. WEB-OS management holds final decision authority."
    },
    {
      num: 30,
      title: "Commission Cancellation and Delays",
      content: "Commissions may be delayed or cancelled if the client refunds, defaults, or if the caller violates pricing rules, logs fake activities, or breaches confidentiality."
    },
    {
      num: 31,
      title: "Caller Removal",
      content: "Violation of rules will lead to suspension or removal. Clean commissions from valid deals will still be paid, but commissions related to fraudulent activity are void."
    },
    {
      num: 32,
      title: "WEB-OS Responsibilities",
      content: "WEB-OS provides lead access, dashboard accounts, outreach scripts, payment confirmation, and commission tracking while ensuring transparent and fair dispute reviews."
    },
    {
      num: 33,
      title: "Caller Responsibilities",
      content: "Callers are responsible for working honestly, using the dashboard correctly, writing high-quality call notes, protecting data, and following up on time."
    },
    {
      num: 34,
      title: "Acceptance Required Before Work",
      content: "No caller may start making outreach calls or gain access to the lead pipeline without explicitly accepting these Terms of Use in their portal dashboard profile."
    },
    {
      num: 35,
      title: "Required Acceptance Text",
      content: "The caller accepts that outreach work is commission-based, paid only from money actually received, and that they cannot promise custom prices or free work without management approval."
    },
    {
      num: 36,
      title: "Final Confirmation",
      content: "By submitting your application and accepting these terms, you confirm you have read and agreed to all 36 clauses above, including lead ownership rules, non-circumvention rules, and data handling requirements."
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col gap-4 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900 uppercase tracking-wide">
                WEB-OS Caller Terms of Use
              </h3>
              <p className="font-body text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
                Version 1.0 • Onboarding Agreement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div className="flex-1 overflow-y-auto pr-2 font-body text-xs text-slate-600 leading-relaxed flex flex-col gap-5 scrollbar-thin">
          <p className="bg-slate-50 border border-slate-150/60 rounded-xl p-3.5 text-slate-500 font-semibold text-[10px] uppercase tracking-wide">
            IMPORTANT: You must review and agree to these terms before submitting your outreach caller request. Acceptable behavior, data privacy, and payment conditions are detail-logged.
          </p>

          <div className="space-y-4">
            {sections.map((sec) => (
              <div key={sec.num} className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors bg-white/50">
                <h4 className="font-display text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  {sec.num}. {sec.title}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {sec.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-body text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
