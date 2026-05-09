import React from 'react';

const AppsPage = () => {
  return (
    <section className="glass-card rounded-[32px] p-8 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-shivi-pink-200">Apps</p>
          <h1 className="text-3xl font-semibold text-white">App access</h1>
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-6">
        <p className="text-white/80">Future module registration for approved apps and per-app permission management.</p>
      </div>
    </section>
  );
};

export default AppsPage;
