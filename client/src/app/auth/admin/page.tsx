"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

export default function AdminAuth() {
  const router = useRouter();
  const { updateState } = useAppStore();
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [expectedOtp, setExpectedOtp] = useState('');
  const [mockSms, setMockSms] = useState<string | null>(null);
  const [otpError, setOtpError] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
    setExpectedOtp(generatedCode);
    setOtpSent(true);
    setOtpError(false);
    setTimeout(() => {
      setMockSms(generatedCode);
      setTimeout(() => setMockSms(null), 6000);
    }, 1500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    if (otp === expectedOtp) {
      updateState(prev => ({ ...prev, auth: { ...prev.auth, admin: true } }));
      router.push('/admin');
    } else {
      setOtpError(true);
      setOtp('');
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#FFF9F0] flex items-center justify-center p-4 md:p-8 font-sans relative overflow-hidden">
      {/* MOCK SMS TOAST NOTIFICATION */}
      {mockSms && (
        <div className="fixed top-6 right-6 md:top-10 md:right-10 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 p-4 w-80 z-50 animate-[reveal_0.4s_ease-out] flex gap-4 items-start">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shrink-0 mt-1 shadow-inner">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-gray-900 text-sm">Messages</span>
              <span className="text-gray-400 text-xs font-medium">Just now</span>
            </div>
            <p className="text-sm text-gray-600 leading-snug">
              Your DishDash verification code is <strong className="text-gray-900 text-base tracking-widest">{mockSms}</strong>. Don't share this with anyone!
            </p>
          </div>
        </div>
      )}

      {/* Background Abstract Shapes (DishDash style) */}
      <div className="absolute top-0 left-[20%] w-64 h-64 bg-[#2D5A27] rounded-full mix-blend-multiply filter blur-2xl opacity-50 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFF9F0] rounded-full mix-blend-multiply filter blur-sm opacity-70 translate-y-1/2 -translate-x-1/2"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6347] rounded-full mix-blend-multiply filter blur-3xl opacity-60 translate-x-1/4 -translate-y-1/4"></div>
      <div className="absolute top-[60%] left-0 w-32 h-64 bg-black rounded-r-full opacity-90 -translate-x-1/2"></div>

      {/* STEP 1: AUTHENTICATION (DishDash UI) */}
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col h-[85vh] min-h-[650px] relative z-10 animate-reveal overflow-hidden border border-gray-100">

        {/* Top Header */}
        <div className="flex justify-between items-center px-10 pt-8 pb-4 bg-white z-20 shadow-sm relative">
          <div className="flex items-center gap-2">
            <img src="/dishdash-logo.png" alt="DishDash Logo" className="h-12 w-auto object-contain" />
            <span className="text-gray-400 text-xl font-bold not-italic">Admin</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">

          {/* LEFT SIDE: New Illustration */}
          <div className="hidden md:flex w-1/2 relative bg-[#FDFDFD] items-center justify-center p-8">
            <div
              className="w-full h-full max-w-lg max-h-lg"
              style={{
                backgroundImage: "url('/admin-auth.jpg')",
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}
            ></div>
          </div>

          {/* RIGHT SIDE: FORM */}
          <div className="w-full md:w-1/2 bg-white px-10 md:px-16 flex flex-col justify-center pb-12 z-10 relative">
            <div className="max-w-md mx-auto w-full mt-8">

              {!otpSent ? (
                <>
                  <h1 className="text-[40px] font-medium text-gray-900 mb-4 tracking-tight leading-[1.1]">
                    Manage Operations 📊
                  </h1>
                  <p className="text-gray-500 text-[14px] leading-relaxed mb-10 pr-4">
                    Enter your admin mobile number below. We'll send a magic code to securely access the dashboard.
                  </p>

                  <form onSubmit={handleSendOtp} className="flex flex-col gap-1 mb-6 animate-reveal">
                    {/* Mobile Number Field Container */}
                    <div className="bg-[#F6F7FB] rounded-xl px-5 pt-3 pb-2 flex items-center gap-4">
                      <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                      <div className="flex-1 flex flex-col">
                        <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Mobile Number</label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-800 font-bold">+91</span>
                          <input
                            type="tel"
                            placeholder="999 999 9999"
                            className="bg-transparent border-none outline-none text-lg text-gray-800 font-bold w-full placeholder-gray-300 tracking-wide"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            autoFocus
                          />
                        </div>
                      </div>
                      {phone.length === 10 && (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0 animate-reveal">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="mt-8">
                      <button
                        type="submit"
                        disabled={phone.length < 10}
                        className={`w-full py-4 rounded-full font-bold text-[14px] shadow-[0_8px_20px_rgba(51,51,51,0.25)] transition-all flex items-center justify-center gap-2 ${phone.length === 10 ? 'bg-[#333333] text-white hover:bg-black active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        Send Magic Code ✨
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 animate-[reveal_0.4s_ease-out]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                  </div>
                  <h1 className="text-[36px] font-medium text-gray-900 mb-4 tracking-tight leading-[1.1] animate-[reveal_0.5s_ease-out]">
                    Check your texts! 📱
                  </h1>
                  <p className="text-gray-500 text-[14px] leading-relaxed mb-10 pr-4 animate-[reveal_0.6s_ease-out]">
                    We've just beamed a 4-digit secret code to <strong className="text-gray-800">+91 {phone}</strong>. Punch it in below to verify your identity.
                  </p>

                  <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6 animate-[reveal_0.7s_ease-out]">
                    <div className="flex justify-between gap-3">
                      <div className="relative w-full flex gap-3">
                        <input
                          type="text"
                          maxLength={4}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-text z-20"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          autoFocus
                        />
                        {[0, 1, 2, 3].map((index) => (
                          <div key={index} className={`flex-1 aspect-square rounded-2xl flex items-center justify-center text-3xl font-black transition-all ${otp.length === index ? 'bg-white border-2 border-gray-800 shadow-[0_0_15px_rgba(51,51,51,0.2)]' : (otp.length > index ? 'bg-gray-50 border-2 border-gray-200 text-gray-800' : 'bg-[#F6F7FB] border-2 border-transparent text-gray-400')}`}>
                            {otp[index] || ''}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 relative">
                      <button
                        type="submit"
                        disabled={otp.length < 4}
                        className={`w-full py-4 rounded-full font-bold text-[14px] shadow-[0_8px_20px_rgba(51,51,51,0.25)] transition-all flex items-center justify-center gap-2 ${otp.length === 4 ? 'bg-[#333333] text-white hover:bg-black active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        Verify & Enter 🚀
                      </button>
                      {otpError && (
                        <p className="absolute -bottom-7 w-full text-center text-red-500 text-xs font-bold animate-[reveal_0.2s_ease-out]">
                          Incorrect code. Please try again.
                        </p>
                      )}
                    </div>

                    <div className="text-center mt-2">
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(''); }} className="text-sm font-bold text-gray-400 hover:text-gray-800 transition-colors">
                        Wrong number? Go back
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
