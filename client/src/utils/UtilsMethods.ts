export function getCuisineColor(cuisine: string):string {
    const colors: Record<string, string> = {
      pugliese: "bg-[hsl(var(--forest-green))]/10 text-[hsl(var(--forest-green))]",
      italiana: "bg-[hsl(var(--olive-drab))]/10 text-[hsl(var(--olive-drab))]",
      pesce: "bg-blue-100 text-blue-700",
      barbecue: "bg-red-100 text-red-700",
      steakhouse: "bg-gray-100 text-gray-700",
      mediterranea: "bg-[hsl(var(--terracotta))]/10 text-[hsl(var(--terracotta))]",
    };
    var color = colors[cuisine]
    console.log(color)
    return color;
  };
  