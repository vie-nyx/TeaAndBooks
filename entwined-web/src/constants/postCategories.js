export const POST_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "general", label: "General" },
  { value: "review", label: "Review" },
  { value: "recommendation", label: "Recommendation" },
  { value: "currently-reading", label: "Currently Reading" },
  { value: "quote", label: "Quote" },
  { value: "discussion", label: "Discussion" },
  { value: "tbr", label: "TBR" }
];

export const POST_CREATION_CATEGORIES = POST_CATEGORIES.filter(
  (category) => category.value !== "all"
);

export const getPostCategoryLabel = (value) => {
  return (
    POST_CATEGORIES.find((category) => category.value === value)?.label ||
    "General"
  );
};
