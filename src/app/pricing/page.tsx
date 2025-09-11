"use client"

import { GlowDiv } from "@/components/ui/GlowDiv"
import { Check } from "lucide-react"
import HomeNav from "@/components/core/HomeNav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PricingPage() {
    const freeFeatures = [
        "Up to 3 Chats",
        "Only 1 Project",
        "Limited token limit for each chat",
    ]

    const proFeatures = [
        "Up to 100 Chats",
        "Up to 5 Projects",
        "Better LLM models",
        "Up to 100 chats per project",
        "Extended token limit for each chat",
    ]

    return (
        <div className="min-h-screen bg-black">
            {/* Navigation */}
            <div className="sticky top-0 z-50 px-4 py-2 ">
                <HomeNav />
            </div>

            <div className="container mx-auto px-4 py-16 dark">
      {/* Hero Section */}
      <div className="text-center mb-16">
      <h1 className="relative z-10 text-lg md:text-5xl  bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600  text-center font-sans font-bold">
          Choose Your <span className="text-primary">Perfect Plan</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
          Start for free and upgrade when you need more power. Our flexible pricing grows with your projects.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
        {/* Free Plan */}
        <Card className="relative border-border bg-card hover:border-primary/50 transition-colors duration-300 flex flex-col">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl font-bold">Free</CardTitle>
            <CardDescription className="text-muted-foreground">Perfect for getting started</CardDescription>
            <div className="mt-3">
              <span className="text-3xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 flex-1">
            {freeFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-card-foreground text-sm">{feature}</span>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full h-10 text-sm border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors bg-transparent"
            >
              Get Started Free
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <GlowDiv variant="red" className="relative p-0">
          <Card className="relative border-none flex flex-col h-full bg-black ring-1 ring-red-500/20 hover:ring-red-500/30 transition-shadow duration-300">

            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl font-bold">Pro</CardTitle>
              <CardDescription className="text-muted-foreground">For power users and teams</CardDescription>
              <div className="mt-3">
                <span className="text-3xl font-bold">$10</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-1">
              {proFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span className="text-card-foreground text-sm">{feature}</span>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button className="w-full h-10 text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_24px_rgba(220,38,38,0.35)] hover:shadow-[0_0_36px_rgba(220,38,38,0.5)]">
                Upgrade to Pro
              </Button>
            </CardFooter>
          </Card>
        </GlowDiv>
      </div>

      {/* Additional Info */}
      <div className="text-center mt-16">
        <p className="text-muted-foreground">All plans include our core features. Upgrade or downgrade anytime.</p>
        <div className="flex justify-center gap-8 mt-8 text-sm text-muted-foreground">
          <span>✓ Cancel anytime</span>
          <span>✓ 24/7 support</span>
        </div>
      </div>

      {/* Footer */}
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
              <Link href="/refund-policy" className="text-muted-foreground hover:text-primary transition-colors">Refund Policy</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
        </div>
    )
}