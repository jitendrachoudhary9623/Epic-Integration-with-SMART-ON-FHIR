import { useState, useEffect } from 'react';

type EMR = {
  id: string;
  name: string;
};

export const useLocalStorageEMR = (): [EMR[], string, React.Dispatch<React.SetStateAction<string>>] => {
  const emrList: EMR[] = [
    { id: '1', name: 'Epic' },
    { id: '2', name: 'Cerner' },
    { id: '3', name: 'Allscripts' },
    { id: '4', name: 'Meditech' },
    { id: '5', name: 'Athena' },
    { id: '6', name: 'NextGen' },
  ];

  const [selectedEMR, setSelectedEMR] = useState<string>(() => {
    const storedEMR = localStorage.getItem('selectedEMR');
    return storedEMR && emrList.some(emr => emr.id === storedEMR) ? storedEMR : '';
  });

  useEffect(() => {
    if (selectedEMR) {
      localStorage.setItem('selectedEMR', selectedEMR);
    } else {
      localStorage.removeItem('selectedEMR');
    }
  }, [selectedEMR]);

  return [emrList, selectedEMR, setSelectedEMR];
};