"use client"

import { GlowDiv } from "@/components/ui/GlowDiv"
import { Check } from "lucide-react"
import HomeNav from "@/components/core/HomeNav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import TempFooter from "@/components/core/TempFooter"
import { useUser } from "@clerk/nextjs"
import { fetchUserWithSubscription } from "../../../actions/subscription"
import useUserSubscription from "@/hooks/useSubscription"
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const { userSubscription, isLoadingUserSubscription, isErrorUserSubscription } = useUserSubscription();
    const { user } = useUser();
   
    const router = useRouter();
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

    const handleSubscription = async () => {
      if(!user){
        router.push('/sign-in');
        return;
      }
      const userWithSubscription = await fetchUserWithSubscription(user.id);
      if(userWithSubscription?.subscriptionPlan == "FREE" && userWithSubscription?.subscription?.status !== "ACTIVE"){
        const redirectUrl = "https://rested-anchovy-mistakenly.ngrok-free.app/success";
        const liveRedirectUrl = "https://devildev.com/success";
        const userEmail = userWithSubscription.email;
        
        const url = `https://test.checkout.dodopayments.com/buy/pdt_WOJtkAzaBaXWSYEKRxIGa?quantity=1&redirect_url=${redirectUrl}&email=${userEmail}&disableEmail=true`;
        const liveUrl = `https://checkout.dodopayments.com/buy/pdt_cI4VU7DR9rRQGlD0QHERi?quantity=1&redirect_url=${liveRedirectUrl}&email=${userEmail}&disableEmail=true`;

        if(!liveUrl){
          alert("Payment link not found");
          return;
        }
        window.location.href = liveUrl;
        return;
      }else{ 
        alert("You are rich man")
      }
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Navigation */}
            <div className="sticky top-0 z-50 px-4 py-2 ">
                <HomeNav />
            </div>

            <div className="  container mx-auto px-4 py-16 dark">
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
            {userSubscription ? (
              <Button
              onClick={() => router.push('/settings?tab=billing')}
              variant="outline"
              className="w-full h-10 text-sm border-border hover:bg-primary  hover:border-primary transition-colors bg-transparent"
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
              {userSubscription ? (
                <Button className="w-full h-10 text-sm bg-black border-2 border-green-500/50 hover:bg-black  text-green-400 font-semibold shadow-[0_0_16px_rgba(34,197,94,0.25)] transition-all">
                Already Activated
              </Button>
              ) : (
                 <Button onClick={() => handleSubscription()} className="w-full h-10 text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_24px_rgba(220,38,38,0.35)] hover:shadow-[0_0_36px_rgba(220,38,38,0.5)]">
                 Upgrade to Pro
               </Button>
              )}
             
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
      <TempFooter/>
    </div>
        </div>
    )
}