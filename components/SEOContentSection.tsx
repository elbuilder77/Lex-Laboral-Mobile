import React from 'react';

interface SEOContentSectionProps {
  title: string;
  intro: string;
  highlights: Array<{
    title: string;
    body: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export const SEOContentSection: React.FC<SEOContentSectionProps> = ({
  title,
  intro,
  highlights,
  faqs,
}) => {
  return (
    <section className="mt-12 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-8 md:p-10">
      <div className="max-w-4xl">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">
          {title}
        </h2>
        <p className="mt-3 text-sm md:text-base text-slate-600 leading-7">
          {intro}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {highlights.map((item) => (
          <article
            key={item.title}
            className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-6"
          >
            <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-6">{item.body}</p>
          </article>
        ))}
      </div>

    </section>
  );
};
