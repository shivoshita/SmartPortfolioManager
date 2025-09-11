import PortfolioChart from '../PortfolioChart'

// TODO: remove mock functionality
const mockChartData = [
  { date: 'Jan 2024', value: 85000, benchmark: 83000 },
  { date: 'Feb 2024', value: 88500, benchmark: 84200 },
  { date: 'Mar 2024', value: 92000, benchmark: 86500 },
  { date: 'Apr 2024', value: 89500, benchmark: 87800 },
  { date: 'May 2024', value: 95000, benchmark: 90200 },
  { date: 'Jun 2024', value: 98500, benchmark: 91500 },
  { date: 'Jul 2024', value: 102000, benchmark: 93800 },
  { date: 'Aug 2024', value: 107500, benchmark: 96200 },
  { date: 'Sep 2024', value: 112000, benchmark: 98500 },
  { date: 'Oct 2024', value: 118500, benchmark: 101200 },
  { date: 'Nov 2024', value: 123000, benchmark: 103800 },
  { date: 'Dec 2024', value: 125847, benchmark: 105500 },
];

export default function PortfolioChartExample() {
  return (
    <PortfolioChart 
      data={mockChartData}
      title="Portfolio Performance"
      description="Track your portfolio growth over time"
      showBenchmark={true}
    />
  );
}