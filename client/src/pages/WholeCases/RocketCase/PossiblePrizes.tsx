// import React, { useEffect } from "react";
// import Dice from "../../../../assets/prize/dice.webp";
// import StarIcon from "../../../../assets/prize/StarsIcon.webp";

// type PrizeItem = {
//   id: string;
//   img: string;
//   price: number;
//   chance: string;
// };

// interface PossiblePrizesProps {
//   items: Record<number, PrizeItem>;
// }

// export const PossiblePrizes: React.FC<PossiblePrizesProps> = ({ items }) => {
//   useEffect(() => {
//     const container = document.querySelector(".possible-prizes-container") as HTMLElement | null;
//     if (!container) return;

//     const handleWheelScroll = (event: WheelEvent) => {
//       event.preventDefault();
//       container.scrollLeft += event.deltaY; // Горизонтальный скролл
//     };

//     container.addEventListener("wheel", handleWheelScroll as EventListener);
//     return () => container.removeEventListener("wheel", handleWheelScroll as EventListener);
//   }, []);

//   return (
//     <div className="possible-prizes-container">
//       <div className="possible-prizes-inner">
//         {Object.values(items).map((prize, index) => (
//           <div key={index} className="possible-prize">
//             <div className="prize-chance">
//               {prize.chance} <img src={Dice} alt="dice" className="dice-icon" />
//             </div>
//             <div className="prize-image">
//               <img src={prize.img} alt={`Item ID: ${prize.id}`} />
//             </div>
//             <div className="prize-stars">
//               <img src={StarIcon} alt="star" /> {prize.price}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };
