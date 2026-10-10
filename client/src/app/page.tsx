import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F4F4F4] text-black p-6 md:p-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl">
        <h1 className="text-7xl md:text-9xl font-medium leading-[0.95] tracking-[-0.05em] mb-20 text-center">
          Project<br />Antigravity
        </h1>

        <div className="space-y-0 w-full max-w-lg mx-auto">
          <Link href="/customer" className="block group">
            <div className="py-8 divider-top flex justify-between items-center hover:bg-black/5 transition-colors px-4 -mx-4 rounded-xl">
              <h3 className="text-4xl font-medium tracking-tight">Customer</h3>
              <span className="text-3xl font-light">→</span>
            </div>
          </Link>
          <Link href="/rider" className="block group">
            <div className="py-8 divider-top flex justify-between items-center hover:bg-black/5 transition-colors px-4 -mx-4 rounded-xl">
              <h3 className="text-4xl font-medium tracking-tight">Rider</h3>
              <span className="text-3xl font-light">→</span>
            </div>
          </Link>
          <Link href="/admin" className="block group">
            <div className="py-8 divider-top divider flex justify-between items-center hover:bg-black/5 transition-colors px-4 -mx-4 rounded-xl">
              <h3 className="text-4xl font-medium tracking-tight">Admin</h3>
              <span className="text-3xl font-light">→</span>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
