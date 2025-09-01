import React from 'react';
import { TourProvider } from '@reactour/tour';
import { useTourContext } from '@/context/TourContext';
import { useTourSteps } from './TourSteps';

interface ChairTourProps {
  children: React.ReactNode;
}

const ChairTour: React.FC<ChairTourProps> = ({ children }) => {
  const { isTourActive, stopTour } = useTourContext();
  const steps = useTourSteps();

  if (!isTourActive) {
    return <>{children}</>;
  }

  return (
    <TourProvider 
      steps={steps}
      onClickMask={() => {}}
      onClickClose={stopTour}
      showBadge={false}
      showCloseButton={true}
      showDots={true}
      showNavigation={true}
      disableDotsNavigation={false}
      className="reactour__popover"
      maskClassName="reactour__mask"
      highlightedMaskClassName="reactour__highlighted-mask"
    >
      {children}
    </TourProvider>
  );
};

export default ChairTour;