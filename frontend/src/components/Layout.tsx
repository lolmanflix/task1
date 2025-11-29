import Navigation from './Navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navigation />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
