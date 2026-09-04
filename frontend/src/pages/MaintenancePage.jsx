export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 p-5">
      <div className="card p-8 max-w-md w-full text-center space-y-4">
        <div className="text-5xl">🚧</div>
        <h1 className="text-2xl font-black tracking-tight text-ink-800">We'll be right back!</h1>
        <p className="text-sm text-ink-500">
          Habi is undergoing emergency maintenance. Your orders, earnings and data are safe —
          please check back shortly.
        </p>
        <button
          onClick={() => window.location.assign('/')}
          className="px-5 py-2.5 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-xl"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
