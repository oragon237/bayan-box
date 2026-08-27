import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-5">
          <div className="card p-6 max-w-md w-full text-center space-y-3">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-lg font-black text-ink-800">Something went wrong</h2>
            <p className="text-sm text-red-600 break-words">{String(this.state.error?.message || this.state.error)}</p>
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-bayan-600 hover:bg-bayan-700 text-white text-sm font-bold rounded-xl"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}