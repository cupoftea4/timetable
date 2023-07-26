import type { IconStyles } from '@/types/utils';

const CheckMarkIcon = ({ className }: IconStyles) => {
  return (
    <svg className={className} width="18" height="14" viewBox="0 0 18 14" fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path d="M6.1136 13.6359L0.263593 7.57398C-0.0878643 7.20979 -0.0878643 6.6193 0.263593 6.25508L1.53636
       4.93617C1.88781 4.57194 2.4577 4.57194 2.80915 4.93617L6.75 9.01974L15.1908 0.273142C15.5423 -0.0910474
       16.1122 -0.0910474 16.4636 0.273142L17.7364 1.59205C18.0879 1.95624 18.0879 2.54673 17.7364 2.91096L7.3864
       13.636C7.0349 14.0001 6.46506 14.0001 6.1136 13.6359V13.6359Z" fill="white"/>
    </svg>
  );
};

export default CheckMarkIcon;
