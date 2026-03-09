import React from 'react';

const Logo = ({ variant = 'default' }) => {
  const getTextSize = () => {
    switch(variant) {
      case 'large': return { title: 'text-3xl', subtitle: 'text-lg' };
      case 'small': return { title: 'text-xl', subtitle: 'text-xs' };
      default: return { title: 'text-2xl', subtitle: 'text-sm' };
    }
  };

  const { title, subtitle } = getTextSize();

  return (
    <div className="logo-container flex items-center gap-3">
      <div className="logo-mark w-10 h-10 relative">
        <div className="logo-squares absolute w-full h-full">
          <div className="logo-square square-1 absolute w-4.5 h-4.5 bg-primary rounded-md rotate-6 top-0 left-0"></div>
          <div className="logo-square square-2 absolute w-4.5 h-4.5 bg-accent rounded-md -rotate-6 bottom-0 left-1/4"></div>
          <div className="logo-square square-3 absolute w-4.5 h-4.5 bg-info rounded-md rotate-3 top-1/4 right-0"></div>
        </div>
      </div>
      <div className="logo-text">
        <h1 className={`${title} font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent`}>
          Alpha Phoenix
        </h1>
        <p className={`${subtitle} text-secondary tracking-wider`}>
          Trading Matrix
        </p>
      </div>
    </div>
  );
};

export default Logo;