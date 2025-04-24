// import Bear from "../../../../assets/prize/bear.webp";
// import Heart from "../../../../assets/prize/heartTape.webp";
// import Gift from "../../../../assets/prize/gift.webp";
// import StarIcon from "../../../../assets/prize/StarsIcon.webp";
// import Gem from "../../../../assets/prize/gem.webp";
// import Ring from "../../../../assets/prize/ring.webp";
// import Trophy from "../../../../assets/prize/trophy.webp";
// import Rocket from "../../../../assets/prize/rocket.webp";
// import Roses from "../../../../assets/prize/roses.webp";
// import Cake from "../../../../assets/prize/cake.webp";
// import RoseSingle from "../../../../assets/prize/roseSingle.webp";
// import Champangne from "../../../../assets/prize/champangne.webp";
// import happyBirth from "../../../../assets/prize/happyBirth.webp";
// import rareRocket from "../../../../assets/prize/rareRocket.webp";

// export interface Item {
//   id: string;
//   img: string;
//   price: number;
//   collection?: string;
//   model?: string;
//   backdrop?: string;
//   symbol?: string;
// }

// export const items: Record<number | string, Item> = {
//   1: { id: "5170233102089322756", img: Bear, price: 15 },
//   2: { id: "5170145012310081615", img: Heart, price: 15 },
//   3: { id: "5170250947678437525", img: Gift, price: 25 },
//   4: { id: "5170521118301225164", img: Gem, price: 100 },
//   5: { id: "5170690322832818290", img: Ring, price: 100},
//   6: { id: "5168043875654172773", img: Trophy, price: 100},
//   7: { id: "5170564780938756245", img: Rocket, price: 50},
//   8: { id: "5170314324215857265", img: Roses, price: 50},
//   9: { id: "5170144170496491616", img: Cake, price: 50},
//   10: { id: "5168103777563050263", img: RoseSingle, price: 25},
//   11: { id: "6028601630662853006", img: Champangne, price: 50},
//   12: { id: "5782984811920491178", img: happyBirth, price: 350},
//   13: { id: "6042113507581755979", img: rareRocket, price: 200},
// };

// let currentMarginLeft = 0;

// export function generateRoulette(winningId?: string) {
//   const rouletteContainer = document.getElementById("roulette-container") as HTMLElement;
//   if (!rouletteContainer) return;

//   // Reset
//   currentMarginLeft = 0;
//   rouletteContainer.innerHTML = "";
//   rouletteContainer.style.marginLeft = "0px";
//   rouletteContainer.style.transition = "none";

//   const totalItems = 104;
//   const winningIndex = 95;

//   for (let i = 0; i < totalItems; i++) {
//     if (winningId && i === winningIndex) {
//       rouletteContainer.appendChild(createRouletteItem(winningId));
//     } else {
//       rouletteContainer.appendChild(createRouletteItem());
//     }
//   }
// }

// export function startRolling(winningId: string, onComplete: () => void) {
//   const rouletteContainer = document.getElementById("roulette-container");
//   const holder = document.querySelector(".raffle-roller-holder") as HTMLElement;

//   if (!rouletteContainer || !holder) return;

//   const itemWidth = 85; // обязательно совпадает с .item width
//   const moveSteps = 95;

//   // 👇 Получаем ширину самого holder и вычитаем половину ширины айтема
//   const offsetToCenter = holder.offsetWidth / 2 - itemWidth / 2;

//   const currentMarginLeft = -(moveSteps * itemWidth) + offsetToCenter;

//   rouletteContainer.style.transition = "all 4s cubic-bezier(.08,.6,0,1)";
//   rouletteContainer.style.marginLeft = `${currentMarginLeft}px`;

//   setTimeout(() => {
//     highlightWinningItem(winningId);
//     onComplete();
//   }, 4000); // чуть больше, чем transition
// }

// function highlightWinningItem(winningId: string) {
//   const rouletteContainer = document.getElementById("roulette-container");
//   if (!rouletteContainer) return;

//   const itemsList = Array.from(rouletteContainer.children) as HTMLElement[];

//   for (const item of itemsList) {
//     if (item.dataset.id === winningId) {
//       item.classList.add("winning-item");
//       break;
//     }
//   }
// }

// function createRouletteItem(forcedItemId?: string): HTMLElement {
//   const element = document.createElement("div");
//   element.classList.add("item");

//   const selectedItem = forcedItemId
//     ? Object.values(items).find((item) => item.id === forcedItemId)!
//     : getRandomItem();

//   element.dataset.id = selectedItem.id;
//   element.style.backgroundImage = `url(${selectedItem.img})`;

//   const priceContainer = document.createElement("div");
//   priceContainer.classList.add("price-container");

//   const starImg = document.createElement("img");
//   starImg.src = StarIcon;
//   starImg.classList.add("star-icon");

//   const priceText = document.createElement("span");
//   priceText.innerText = `${selectedItem.price}`;
//   priceText.classList.add("price-text");

//   priceContainer.appendChild(starImg);
//   priceContainer.appendChild(priceText);
//   element.appendChild(priceContainer);

//   return element;
// }

// function getRandomItem(): Item {
//   const itemsArray = Object.values(items);
//   return itemsArray[Math.floor(Math.random() * itemsArray.length)];
// }

// export function determineNextWinningId(): string {
//   return getRandomItem().id;
// }

// function randomInt(min: number, max: number): number {
//   return Math.floor(Math.random() * (max - min)) + min;
// }
