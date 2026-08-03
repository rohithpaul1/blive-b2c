import Marquee from "react-fast-marquee";

const CompanyCards = () => {
  const list = ["Ola", "Ather", "TVS", "Bounce", "Ampere", "Lectrix", "Revolt"];

  return (
    <div className="w-full mt-[80px] mx-auto opacity-[33%] overflow-hidden">
      <Marquee gradient={false} speed={40}>
        {list.map((i) => (
          <img
            key={i}
            src={`/images/${i}.png`}
            alt={`${i} Logo`}
            className="w-[150px] object-contain mx-16"
          />
        ))}
      </Marquee>
    </div>
  );
};

export default CompanyCards;
