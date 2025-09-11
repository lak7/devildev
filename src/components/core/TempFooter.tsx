import Link from "next/link";

export default function TempFooter() {
    return (
        <footer className="mt-20 border-t border-border pt-10 pb-14">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground/80 mb-3">Navigate</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link>
              <Link href="/community" className="text-muted-foreground hover:text-primary transition-colors">Community</Link>
              <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
            </nav>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-card-foreground/80 mb-3">Legal</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/terms-and-conditions" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            </nav>
          </div>
        </div>
      </footer>
    )
}