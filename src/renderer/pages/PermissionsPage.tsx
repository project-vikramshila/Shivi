import React from 'react';

const PermissionsPage = () => {
  return (
    <section className="glass-card rounded-[32px] p-8 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-shivi-pink-200">Permissions</p>
          <h1 className="text-3xl font-semibold text-white">Permission manager</h1>
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-6 space-y-3">
        <div className="rounded-2xl bg-shivi-dark-900 p-4 border border-white/5">
          <p className="font-semibold text-white">Read</p>
          <p className="text-sm text-white/70">View only access for approved applications and local data sources.</p>
        </div>
        <div className="rounded-2xl bg-shivi-dark-900 p-4 border border-white/5">
          <p className="font-semibold text-white">Navigate</p>
          <p className="text-sm text-white/70">UI movement permission for guided automation flows.</p>
        </div>
        <div className="rounded-2xl bg-shivi-dark-900 p-4 border border-white/5">
          <p className="font-semibold text-white">Type</p>
          <p className="text-sm text-white/70">Typing permission for form completion and smart replies.</p>
        </div>
      </div>
    </section>
  );
};

export default PermissionsPage;
