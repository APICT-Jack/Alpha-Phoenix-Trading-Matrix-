import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, 
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         Cell } from 'recharts';

const ChartTab = ({ academy }) => {
  // Sample chart data - replace with actual academy data
  const chartData = academy.chartData || [
    { month: 'Jan', students: 400, revenue: 2400, completion: 75 },
    { month: 'Feb', students: 600, revenue: 3800, completion: 82 },
    { month: 'Mar', students: 800, revenue: 4200, completion: 78 },
    { month: 'Apr', students: 1200, revenue: 5200, completion: 85 },
    { month: 'May', students: 1500, revenue: 6100, completion: 88 },
    { month: 'Jun', students: 1800, revenue: 7200, completion: 92 },
  ];

  const courseDistribution = [
    { name: 'Beginner', value: 35, color: '#8884d8' },
    { name: 'Intermediate', value: 45, color: '#82ca9d' },
    { name: 'Advanced', value: 20, color: '#ffc658' },
  ];

  return (
    <div className="edu-charts">
      <div className="edu-charts__grid">
        {/* Student Growth Chart */}
        <div className="edu-chart__card">
          <h3>Student Growth</h3>
          <div className="edu-chart__container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="students" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="edu-chart__card">
          <h3>Monthly Revenue</h3>
          <div className="edu-chart__container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Completion Rate */}
        <div className="edu-chart__card">
          <h3>Completion Rate</h3>
          <div className="edu-chart__container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completion" stroke="#ffc658" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Distribution */}
        <div className="edu-chart__card">
          <h3>Course Level Distribution</h3>
          <div className="edu-chart__container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={courseDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {courseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartTab;