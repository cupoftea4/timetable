import { useState } from 'react';
import HeaderPanel from '../components/HeaderPanel';
import '../styles/main.scss';
import './HomePage.module.scss';

const HomePage = () => {
  const [selectedInstitute, setSelectedInstitute] = useState<string | null>(null);
  console.log(selectedInstitute, setSelectedInstitute);
  
  return (
    <>
      <HeaderPanel />
      
    </>
  )
};

export default HomePage;