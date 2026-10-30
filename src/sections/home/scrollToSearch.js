// Plan CTAs on the homepage lead back to the hero search, where dates are picked.
export const scrollToSearch = (event) => {
  event?.preventDefault?.();
  const target = document.getElementById("hero-search") || document.getElementById("hero");
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
};
