
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Navbar } from "@/components/ui/navbar";
import { GradientText } from "@/components/ui/gradient-text";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/ui/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden">
      <Navbar />
      <div className="flex flex-col pb-4 pt-[100px] -mt-20">
        <ContainerScroll
          titleComponent={
            <>
              <h1 className="text-4xl font-semibold text-black dark:text-white">
                Welcome to <br />
                <GradientText className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                  ISBMUN Dashboard 2025
                </GradientText>
              </h1>
            </>
          }
        >
          <img
            src="/Screenshot%202025-04-20%20180839.png"
            alt="ISBMUN"
            className="mx-auto rounded-2xl object-contain h-full"
            draggable={false}
          />
        </ContainerScroll>

        <div className="max-w-3xl mx-auto px-4 text-center -mt-30 md:-mt-32">
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            Access our comprehensive conference dashboard, designed specifically for ISBMUN 2025 delegates. 
            Track your committee sessions, manage documents, and stay updated with real-time notifications. 
            Join us in making this conference a seamless digital experience.
          </p>
          <Button asChild className="group px-8 py-3 text-base">
            <Link to="/login" className="flex items-center gap-2">
              Login
              <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>

      <Footer
        logo={null}
        brandName="ISBMUN"
        socialLinks={[]}
        mainLinks={[]}
        legalLinks={[]}
        copyright={{
          text: "© 2025 ISBMUN",
          license: "All rights reserved",
        }}
      />
    </div>
  );
}

