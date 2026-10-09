import { Order } from './store';
import { RECIPES } from './recipes';

export function getCartPersonalityMessage(orders: Order[], configuringRecipeId?: string | null): string {
  const allOrderedNames = orders.map(o => o.recipe);
  const configuringRecipe = configuringRecipeId ? RECIPES.find(r => r.id === configuringRecipeId) : null;
  
  const currentDishes = [...allOrderedNames];
  if (configuringRecipe) {
    if (!currentDishes.includes(configuringRecipe.name)) {
      currentDishes.push(configuringRecipe.name);
    }
  }

  const uniqueDishes = Array.from(new Set(currentDishes));
  
  if (uniqueDishes.length === 0) {
    return "Discover flavors crafted by culinary masters.";
  }

  // Simple hash function to deterministically pick a template based on the dish names
  // This prevents React re-render flickering while ensuring every combination gets a different phrase.
  const hash = uniqueDishes.join('|').split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const getIndex = (arrLength: number) => Math.abs(hash) % arrLength;

  if (uniqueDishes.length === 1) {
    const singleTemplates = [
      `Excellent call on the ${uniqueDishes[0]}. Minimalist and refined.`,
      `Just ${uniqueDishes[0]}? Someone knows exactly what they want.`,
      `The ${uniqueDishes[0]} is an absolute classic choice.`,
      `Focusing purely on the ${uniqueDishes[0]}. A true purist.`,
      `Preparing your ${uniqueDishes[0]} with utmost perfection.`
    ];
    return singleTemplates[getIndex(singleTemplates.length)];
  }
  
  if (uniqueDishes.length === 2) {
    const [first, second] = uniqueDishes;
    const fLower = first.toLowerCase();
    const sLower = second.toLowerCase();
    
    if ((fLower.includes('chicken') && sLower.includes('naan')) || (fLower.includes('naan') && sLower.includes('chicken'))) {
      const indianTemplates = [
        `${first} and ${second} — an absolutely legendary pairing.`,
        `You can't go wrong with ${first} and ${second}. Pure comfort.`,
        `The ${first} and ${second} combo is undefeated.`
      ];
      return indianTemplates[getIndex(indianTemplates.length)];
    }
    if (fLower.includes('burger') && sLower.includes('fries')) {
      const burgerTemplates = [
        `${first} and ${second}. Some problems just need calories, not conversation.`,
        `The ${first} and ${second}: a certified mood lifter.`,
        `Nothing beats the classic ${first} paired with ${second}.`
      ];
      return burgerTemplates[getIndex(burgerTemplates.length)];
    }
    
    const doubleTemplates = [
      `${first} paired with ${second}? A remarkably bold combination.`,
      `The ${first} and ${second} combo... A harmony of flavors.`,
      `${first} and ${second}: An inspired culinary decision.`,
      `Whoever thought of pairing ${first} with ${second} deserves an award.`,
      `Trusting your palate on this ${first} and ${second} masterpiece.`
    ];
    return doubleTemplates[getIndex(doubleTemplates.length)];
  }

  if (uniqueDishes.length === 3) {
    const tripleTemplates = [
      `${uniqueDishes[0]}, ${uniqueDishes[1]}, and ${uniqueDishes[2]}... Your palate is going on a world tour!`,
      `A golden trio: ${uniqueDishes[0]}, ${uniqueDishes[1]}, and ${uniqueDishes[2]}.`,
      `${uniqueDishes[0]}, ${uniqueDishes[1]}, and ${uniqueDishes[2]}. A three-course triumph.`,
      `Balancing ${uniqueDishes[0]} with ${uniqueDishes[1]} and ${uniqueDishes[2]}? Masterful.`
    ];
    return tripleTemplates[getIndex(tripleTemplates.length)];
  }
  
  const massiveTemplates = [
    `${uniqueDishes[0]}, ${uniqueDishes[1]}, and ${uniqueDishes.length - 2} more... This isn't a meal, it's a diplomatic summit.`,
    `${uniqueDishes[0]}, ${uniqueDishes[1]}, and ${uniqueDishes.length - 2} more dishes. Preparing the ultimate feast.`,
    `A royal spread starting with ${uniqueDishes[0]} and ${uniqueDishes[1]}... spectacular.`,
    `${uniqueDishes.length} distinct dishes? You are not holding back today.`
  ];
  return massiveTemplates[getIndex(massiveTemplates.length)];
}
