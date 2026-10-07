import React from 'react';
import { Plus, Briefcase, Calendar, CheckSquare, Sparkles } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'blank',
    title: 'Blank Document',
    subtitle: 'Start from scratch',
    defaultTitle: 'Untitled Document',
    icon: Plus,
    bgGradient: 'from-blue-500 to-indigo-600',
    borderColor: 'border-blue-200 hover:border-blue-400',
    isPrimary: true,
  },
  {
    id: 'proposal',
    title: 'Project Proposal',
    subtitle: 'Scope, timeline & goals',
    defaultTitle: 'Project Proposal — ' + new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    icon: Briefcase,
    bgGradient: 'from-emerald-500 to-teal-600',
    borderColor: 'border-slate-200 hover:border-emerald-300',
  },
  {
    id: 'meeting',
    title: 'Meeting Notes',
    subtitle: 'Agenda, attendees & actions',
    defaultTitle: 'Meeting Notes — ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    icon: Calendar,
    bgGradient: 'from-amber-500 to-orange-600',
    borderColor: 'border-slate-200 hover:border-amber-300',
  },
  {
    id: 'sprint',
    title: 'Weekly Sprint Plan',
    subtitle: 'Tasks & deliverables',
    defaultTitle: 'Weekly Sprint Plan',
    icon: CheckSquare,
    bgGradient: 'from-purple-500 to-pink-600',
    borderColor: 'border-slate-200 hover:border-purple-300',
  },
];

export const TemplateBar = ({ onCreateDocument, isCreating }) => {
  return (
    <section className="bg-slate-100/70 border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Start a new document
          </h2>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Choose a blank canvas or starter template
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
          {TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <button
                key={tmpl.id}
                type="button"
                disabled={isCreating}
                onClick={() => onCreateDocument(tmpl.defaultTitle)}
                className={`group flex flex-col items-start p-4 sm:p-5 bg-white rounded-xl border ${tmpl.borderColor} shadow-xs hover:shadow-md transition-all duration-200 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {/* Template Thumbnail Box */}
                <div
                  className={`w-full aspect-[4/3] rounded-lg bg-gradient-to-br ${tmpl.bgGradient} flex items-center justify-center text-white mb-3 shadow-xs group-hover:scale-[1.02] transition-transform duration-200`}
                >
                  <Icon className="w-8 h-8 opacity-90 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Details */}
                <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {tmpl.title}
                </span>
                <span className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                  {tmpl.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};