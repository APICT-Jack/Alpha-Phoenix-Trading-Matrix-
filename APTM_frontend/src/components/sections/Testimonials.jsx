import React from 'react';
import Logo from '../ui/Logo';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah J.",
      role: "Forex Trader",
      avatar: "https://randomuser.me/api/portraits/women/43.jpg",
      rating: 5,
      content: "The APICT tools and community completely transformed my trading. I went from inconsistent results to a profitable strategy in just 3 months!",
      date: "2 weeks ago",
      profit: "+47% ROI"
    },
    {
      id: 2,
      name: "Michael T.",
      role: "Crypto Trader",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: 4.5,
      content: "The education platform is top-notch. I've tried many trading courses, but APICT's structured approach helped me finally understand market structure.",
      date: "1 month ago",
      profit: "+68% ROI"
    },
    {
      id: 3,
      name: "Priya K.",
      role: "Stocks Trader",
      avatar: "https://randomuser.me/api/portraits/women/65.jpg",
      rating: 5,
      content: "The live trading rooms are invaluable. Seeing professionals analyze markets in real-time accelerated my learning curve more than any book.",
      date: "3 weeks ago",
      profit: "+52% ROI"
    }
  ];

  return (
    <section className="testimonials-section py-20 bg-bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          
          <h2 className="text-3xl font-bold mb-2">Success Stories</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Hear from our community members who transformed their trading
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card bg-card p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <h4 className="font-bold">{testimonial.name}</h4>
                  <p className="text-sm text-text-tertiary">{testimonial.role}</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-${i < Math.floor(testimonial.rating) ? 'yellow-400' : 'text-tertiary'}`}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-text-secondary mb-4">{testimonial.content}</p>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">{testimonial.date}</span>
                <span className="font-bold text-success">{testimonial.profit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;