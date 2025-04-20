
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Navbar } from "@/components/ui/navbar";
import { GradientText } from "@/components/ui/gradient-text";

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
      </div>
    </div>
  );
}
