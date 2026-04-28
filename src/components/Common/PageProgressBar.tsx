import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const PageProgressBar = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    setProgress(30);

    const timer1 = setTimeout(() => setProgress(70), 100);
    const timer2 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 200);
    }, 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [location.pathname]);

  if (!isVisible) return null;

  return (
    <div id="nprogress">
      <div 
        className="bar transition-all duration-300 ease-out" 
        style={{ width: `${progress}%` }} 
      />
    </div>
  );
};
