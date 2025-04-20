
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Navbar } from "@/components/ui/navbar";
import { GradientText } from "@/components/ui/gradient-text";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden">
      <Navbar />
      <div className="flex flex-col pb-[200px] pt-[100px]">
        <ContainerScroll
          titleComponent={
            <>
              <h1 className="text-4xl font-semibold text-black dark:text-white">
                Welcome to <br />
                <GradientText className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                  ISBMUN 2025
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

        <div className="max-w-3xl mx-auto px-4 text-center mt-16">
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
            Access our comprehensive conference dashboard, designed specifically for ISBMUN 2025 delegates. 
            Track your committee sessions, manage documents, and stay updated with real-time notifications. 
            Join us in making this conference a seamless digital experience.
          </p>
          <RainbowButton asChild>
            <Link to="/login">Login to Dashboard</Link>
          </RainbowButton>
        </div>
      </div>
    </div>
  );
}
