import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FFFDF7] text-black p-6 md:p-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl">
        <div className="flex justify-center mb-16 relative w-full h-[300px] md:h-[400px]">
          <Image 
            src="/home-logo.jpg" 
            alt="DishDash - Fresh Ingredients. Healthier Living." 
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="space-y-0 w-full max-w-lg mx-auto">
          <Link href="/auth/customer" className="block group">
            <div className="py-8 divider-top flex justify-between items-center hover:bg-black/5 transition-colors px-4 -mx-4 rounded-xl">
              <h3 className="text-4xl font-medium tracking-tight">Customer</h3>
              <span className="text-3xl font-light">→</span>
            </div>
          </Link>
          <Link href="/auth/rider" className="block group">
            <div className="py-8 divider-top flex justify-between items-center hover:bg-black/5 transition-colors px-4 -mx-4 rounded-xl">
              <h3 className="text-4xl font-medium tracking-tight">Rider</h3>
              <span className="text-3xl font-light">→</span>
            </div>
          </Link>
          <Link href="/auth/admin" className="block group">
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
