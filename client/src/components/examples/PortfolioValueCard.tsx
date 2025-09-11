import PortfolioValueCard from '../PortfolioValueCard'

// TODO: remove mock functionality
const mockPortfolioData = {
  totalValue: 125847.32,
  dailyChange: 2847.21,
  dailyChangePercent: 2.31,
  totalReturn: 28472.18,
  totalReturnPercent: 29.2
};

export default function PortfolioValueCardExample() {
  const handleViewDetails = () => {
    console.log('View portfolio details clicked');
  };

  return (
    <PortfolioValueCard 
      portfolioData={mockPortfolioData}
      onViewDetails={handleViewDetails}
    />
  );
}