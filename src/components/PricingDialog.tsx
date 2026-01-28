"use client"

import { GlowDiv } from "@/components/ui/GlowDiv"
import { Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useUser } from "@clerk/nextjs"
import useUserSubscription from "@/hooks/useSubscription"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSubscriptionHandler } from "@/hooks/useSubscriptionHandler"

interface PricingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  description: string
}

export default function PricingDialog({ open, onOpenChange, description }: PricingDialogProps) {
  const { userSubscription } = useUserSubscription()
  const { user } = useUser()
  const router = useRouter()
  const handleSubscription = useSubscriptionHandler()

  const freeFeatures = [
    "Up to 3 Chats",
    "Only 1 Project",
    "Limited token limit for each chat",
  ]

  const proFeatures = [
    "Extended size limit for project architecture",
    "Up to 100 chats per project",
    "Up to 10 Projects",
    "Extended token limit for each chat",
    "Up to 100 Chats",
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl border border-zinc-500 bg-black max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl text-center">Please Upgrade to Continue</DialogTitle>
          <DialogDescription className="text-gray-300 text-center">
            {description}
          </DialogDescription> 
        </DialogHeader>

        <div className="dark mt-6">
          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
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
                {userSubscription ? (
                  <Button
                    onClick={() => router.push('/settings?tab=billing')}
                    variant="outline"
                    className="w-full h-10 text-sm border-border hover:bg-primary hover:border-primary transition-colors bg-transparent"
                  >
                    Downgrade to Free
                  </Button>
                ) : user ? (
                  <Button
                    variant="outline"
                    className="w-full h-10 text-sm border-border hover:bg-primary hover:border-primary transition-colors bg-transparent"
                  >
                    Already Free
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push('/sign-in')}
                    variant="outline"
                    className="w-full cursor-pointer h-10 text-sm border-border hover:bg-primary hover:border-primary transition-colors bg-transparent"
                  >
                    Get Started for Free
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <GlowDiv variant="red" className="relative p-0">
              <Card className="relative border-none flex flex-col h-full bg-black ring-1 ring-red-500/20 hover:ring-red-500/30 transition-shadow duration-300">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-xl font-bold">Pro</CardTitle>
                  <CardDescription className="text-muted-foreground">For power users and teams</CardDescription>
                  <div className="mt-3">
                    <span className="text-3xl font-bold">$25</span>
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
                  {userSubscription ? (
                    <Button className="w-full h-10 text-sm bg-black border-2 border-green-500/50 hover:bg-black text-green-400 font-semibold shadow-[0_0_16px_rgba(34,197,94,0.25)] transition-all">
                      Already Activated
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubscription()}
                      className="w-full h-10 text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_24px_rgba(220,38,38,0.35)] hover:shadow-[0_0_36px_rgba(220,38,38,0.5)]"
                    >
                      Upgrade to Pro
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </GlowDiv>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-8">
            <p className="text-muted-foreground text-sm">
              All plans include our core features. Upgrade or downgrade anytime.
            </p>
            <div className="flex justify-center gap-8 mt-4 text-sm text-muted-foreground">
              <span>✓ Cancel anytime</span>
              <span>✓ 24/7 support</span>
            </div>
            <div className="mt-4">
              <Link href="/pricing" className="text-sm text-red-400 hover:text-red-300 underline">
                View full pricing details
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

