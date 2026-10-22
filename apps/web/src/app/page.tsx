export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm tracking-widest text-muted-foreground uppercase">Private beta</p>
      <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">Watchtower</h1>
      <p className="text-2xl text-foreground">Your systems. One command center.</p>
      <p className="max-w-lg text-base leading-7 text-muted-foreground">
        A private workspace for understanding the health of your systems.
        Access will be available by invitation.
      </p>
    </main>
  );
}
