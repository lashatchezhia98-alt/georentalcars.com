"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import BrandMark from "@/components/BrandMark";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirect: false,
    });
    if (result?.ok) window.location.href = "/admin";
    else {
      setError("ელფოსტა ან პაროლი არასწორია.");
      setLoading(false);
    }
  }

  return (
    <main className="admin-login">
      <section className="login-card">
        <a className="brand" href="/" aria-label="GeoRentalCars home">
          <BrandMark /><span className="brand-name">Geo<span>Rental</span>Cars</span>
        </a>
        <div className="login-heading">
          <span className="eyebrow">OWNER ACCESS</span>
          <h1>ადმინისტრატორის შესვლა</h1>
          <p>ეს სივრცე ხელმისაწვდომია მხოლოდ საიტის მფლობელისთვის.</p>
        </div>
        <form onSubmit={submit}>
          <label>ელფოსტა<input name="email" type="email" autoComplete="username" required autoFocus /></label>
          <label>პაროლი<input name="password" type="password" autoComplete="current-password" required /></label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="button" disabled={loading}>{loading ? "მოწმდება…" : "შესვლა"}</button>
        </form>
        <a className="return-home" href="/">← მთავარ გვერდზე დაბრუნება</a>
      </section>
    </main>
  );
}
