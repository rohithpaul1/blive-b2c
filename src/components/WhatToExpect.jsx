import { useState } from "react";

const WhatToExpect = ({ showDropoff, rentalMode = "fixed", commitmentDuration = 1, commitmentUnit = "month" }) => {
  const [openVehicleCheckup, setOpenVehicleCheckup] = useState(false);
  const [openRulesAndRegulations, setOpenRulesAndRegulations] = useState(false);
  const [openDropoff, setOpenDropoff] = useState(false);

  return (
    <div className="mt-[24px]">
      <p className="font-bold text-[24px] text-[#222222]">What to Expect</p>
      <div className="mt-[16px]">
        <button
          onClick={() => setOpenVehicleCheckup(!openVehicleCheckup)}
          className={`border-b cursor-pointer flex items-center justify-between border-[#EDEDED] py-[16px] h-[50px] w-full`}
        >
          <p className="font-medium text-[#222222]">Vehicle Checkup</p>
          <img
            src="/images/Chevron-Left.png"
            alt="Chevron Right"
            className={`w-[20px] mr-[8px] h-[20px] transition-all duration-500 ${
              openVehicleCheckup ? "rotate-270" : "rotate-180"
            }`}
          />
        </button>
        <div
          className={`pr-[20px] flex flex-col gap-y-[20px] ${
            openVehicleCheckup ? "max-h-[2000px] py-[24px]" : "max-h-0"
          } overflow-hidden transition-all duration-500`}
        >
          <p className="text-[#3A3A3A]">
            Your safety and peace of mind come first. Before every ride, each
            vehicle goes through a multi-point inspection to make sure it’s in
            perfect condition for you
          </p>
          <div className="flex flex-col gap-y-[8px]">
            <p className="font-bold text-[#222222]">Battery Health & Range</p>
            <p className="mt-[8px] text-[#3A3A3A]">
              Fully charged and tested to deliver dependable range, with minimum
              80% charge at pickup.
            </p>
          </div>
          <div className="flex flex-col gap-y-[8px]">
            <p className="font-bold text-[#222222]">Brakes & Tyres</p>
            <p className="mt-[8px] text-[#3A3A3A]">
              Checked for grip, wear, and braking efficiency to ensure maximum
              control and smooth handling.
            </p>
          </div>
          <div className="flex flex-col gap-y-[8px]">
            <p className="font-bold text-[#222222]">
              Lights, Indicators & Horn
            </p>
            <p className="mt-[8px] text-[#3A3A3A]">
              All electricals tested for visibility and signaling in day and
              night conditions.
            </p>
          </div>
          <div className="flex flex-col gap-y-[8px]">
            <p className="font-bold text-[#222222]">
              Suspension & Ride Comfort
            </p>
            <p className="mt-[8px] text-[#3A3A3A]">
              Suspension and steering inspected for a stable, comfortable ride
              on city roads.
            </p>
          </div>
          <div className="flex flex-col gap-y-[8px]">
            <p className="font-bold text-[#222222]">Dashboard & Controls</p>
            <p className="mt-[8px] text-[#3A3A3A]">
              Speedometer, mirrors, switches, and throttle checked for accuracy
              and responsiveness.
            </p>
          </div>
          <div className="flex flex-col gap-y-[8px]">
            <p className="font-bold text-[#222222]">Helmet (if opted)</p>
            <p className="mt-[8px] text-[#3A3A3A]">
              Provided helmets are inspected for safety, hygiene, and comfort.
            </p>
          </div>
          <div className="flex flex-col gap-y-[8px]">
            <p className="font-bold text-[#222222]">Emergency Readiness</p>
            <p className="mt-[8px] text-[#3A3A3A]">
              Equipped with a basic tool kit, first-aid pack, and roadside
              assistance support for added security.
            </p>
          </div>
          <p className="text-[#3A3A3A] italic text-[14px]">
            Every check is done so you can focus only on the joy of driving
            while we take care of the rest.
          </p>
        </div>
        <button
          onClick={() => setOpenRulesAndRegulations(!openRulesAndRegulations)}
          className={`border-b cursor-pointer flex items-center justify-between border-[#EDEDED] py-[16px] h-[50px] w-full`}
        >
          <p className="font-medium text-[#222222]">Rules & Regulations</p>
          <img
            src="/images/Chevron-Left.png"
            alt="Chevron Right"
            className={`w-[20px] mr-[8px] h-[20px] transition-all duration-500 ${
              openRulesAndRegulations ? "rotate-270" : "rotate-180"
            }`}
          />
        </button>
        <div
          className={`pr-[20px] flex flex-col gap-y-[40px] ${
            openRulesAndRegulations ? "max-h-[2000px] py-[24px]" : "max-h-0"
          } overflow-hidden transition-all duration-500`}
        >
          <div className="flex flex-col gap-y-[8px]">
            <p className="font-bold text-[#222222]">
              {rentalMode === "subscription" ? "Subscription & Pick-Up" : "Booking & Pick-Up / Drop-Off"}
            </p>
            <ul className="mt-[8px] text-[#3A3A3A] flex flex-col list-disc pl-5 gap-y-[4px]">
              <li>
                {rentalMode === "subscription"
                  ? `Minimum subscription term: ${commitmentDuration} ${commitmentUnit}${Number(commitmentDuration) === 1 ? "" : "s"}`
                  : "Minimum booking period: 1 day"}
              </li>
              {rentalMode === "subscription" && (
                <li>After the minimum term, billing continues automatically until you cancel.</li>
              )}
              <li>
                {rentalMode === "subscription"
                  ? "Vehicle must be picked up at the agreed start date and time"
                  : "Vehicle must be picked up/dropped off at the agreed time"}
              </li>
              <li>
                {rentalMode === "subscription"
                  ? "To stop renewal after the minimum term, cancel before the next billing date"
                  : "Late returns may attract additional charges"}
              </li>
              <li>Doorstep delivery available in select areas</li>
            </ul>
          </div>
          <div className="flex flex-col gap-y-[8px]">
            <p className="font-bold text-[#222222]">Age & License</p>
            <ul className="mt-[8px] text-[#3A3A3A] flex flex-col list-disc pl-5 gap-y-[4px]">
              <li>
                Minimum rider age: 18 years (scooters/bikes) / 21 years (cars)
              </li>
              <li>
                Valid Driving License required (2-wheeler or 4-wheeler as
                applicable)
              </li>
              <li>eKYC (Aadhaar) required for verification</li>
            </ul>
          </div>
          <div className="flex flex-col gap-y-[8px]">
            <p className="font-bold text-[#222222]">
              Vehicle Use & Restrictions
            </p>
            <ul className="mt-[8px] text-[#3A3A3A] flex flex-col list-disc pl-5 gap-y-[4px]">
              <li>Only registered riders are permitted to use the vehicle</li>
              <li>Helmet must be worn at all times (2-wheelers)</li>
              <li>
                Overspeeding, stunts, or off-road riding strictly prohibited
              </li>
              <li>
                Smoking, alcohol, and drugs strictly not allowed inside/on the
                vehicle
              </li>
              <li>
                Private racing, commercial use, or sub-leasing not permitted
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-y-[8px]">
            <p className="font-bold text-[#222222]">Charging & Range</p>
            <ul className="mt-[8px] text-[#3A3A3A] flex flex-col list-disc pl-5 gap-y-[4px]">
              <li>Vehicle must be returned with minimum 20% charge</li>
              <li>Public charging costs borne by the renter</li>
              <li>
                Range depends on riding/driving style and traffic conditions
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-y-[8px]">
            <p className="font-bold text-[#222222]">Safety & Damage</p>
            <ul className="mt-[8px] text-[#3A3A3A] flex flex-col list-disc pl-5 gap-y-[4px]">
              <li>Vehicles are GPS-enabled for safety & tracking</li>
              <li>In case of damage, renter is liable as per policy</li>
              <li>Accident/Breakdown assistance available via helpline</li>
            </ul>
          </div>
          <div className="flex flex-col gap-y-[8px]">
            <p className="font-bold text-[#222222]">Accessibility</p>
            <ul className="mt-[8px] text-[#3A3A3A] flex flex-col list-disc pl-5 gap-y-[4px]">
              <li>Select EVs available with easy-access features</li>
            </ul>
          </div>
        </div>
        {showDropoff && (
          <>
            <button
              onClick={() => setOpenDropoff(!openDropoff)}
              className={`border-b cursor-pointer flex items-center justify-between border-[#EDEDED] py-[16px] h-[50px] w-full`}
            >
              <p className="font-medium text-[#222222]">
                Drop-off Instructions
              </p>
              <img
                src="/images/Chevron-Left.png"
                alt="Chevron Right"
                className={`w-[20px] mr-[8px] h-[20px] transition-all duration-500 ${
                  openDropoff ? "rotate-270" : "rotate-180"
                }`}
              />
            </button>
            <div
              className={`pr-[20px] flex flex-col gap-y-[20px] ${
                openDropoff ? "max-h-[2000px] py-[24px]" : "max-h-0"
              } overflow-hidden transition-all duration-500`}
            >
              <p className="text-[#3A3A3A]">
                Returning your EV is simple. To make sure everything goes
                smoothly, please follow these steps carefully.
              </p>
              <div className="flex flex-col gap-y-[8px]">
                <p className="font-bold text-[#222222]">
                  Step 1: Plan Your Drop-off in Advance
                </p>
                <ul className="mt-[8px] text-[#3A3A3A] flex flex-col list-disc pl-5 gap-y-[4px]">
                  <li>
                    Check your booking end date and time shown in the booking.
                  </li>
                  <li>
                    Try to arrive at the drop-off location 10–15 minutes before
                    the scheduled time to avoid last-minute delays.
                  </li>
                  <li>
                    If you need extra time, use the Extend Rental option before
                    your booking ends.
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-y-[8px]">
                <p className="font-bold text-[#222222]">
                  Step 2: Navigate to the Drop-off Hub
                </p>
                <ul className="mt-[8px] text-[#3A3A3A] flex flex-col list-disc pl-5 gap-y-[4px]">
                  <li>
                    Your designated return hub is shown under your booking.
                  </li>
                  <li>
                    Ensure you head to the correct hub (drop-offs at other
                    locations may not be accepted unless pre-approved).
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-y-[8px]">
                <p className="font-bold text-[#222222]">
                  Step 3: Park the Vehicle Safely
                </p>
                <ul className="mt-[8px] text-[#3A3A3A] flex flex-col list-disc pl-5 gap-y-[4px]">
                  <li>
                    Once at the hub, follow on-ground signage or staff
                    instructions for the EV parking bay.
                  </li>
                  <li>
                    Park the scooter neatly in the designated EV return zone.
                  </li>
                  <li>
                    Switch off the vehicle and ensure it is on the center stand.
                  </li>
                  <li>Remove the key from the ignition.</li>
                </ul>
              </div>
              <div className="flex flex-col gap-y-[8px]">
                <p className="font-bold text-[#222222]">
                  Step 4: Prepare Accessories for Return
                </p>
                <ul className="mt-[8px] text-[#3A3A3A] flex flex-col list-disc pl-5 gap-y-[4px]">
                  <li>
                    Return all accessories you received during pickup: Vehicle
                    key(s), Helmet(s), Additional add-ons (if any).
                  </li>
                  <li>Place them together and hand them over to the staff.</li>
                  <li>
                    Make sure no personal belongings are left inside the storage
                    compartment or helmet box.
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-y-[8px]">
                <p className="font-bold text-[#222222]">
                  Step 5: Vehicle Condition Check
                </p>
                <ul className="mt-[8px] text-[#3A3A3A] flex flex-col list-disc pl-5 gap-y-[4px]">
                  <li>
                    A quick check will be carried out by hub staff to confirm:
                    <ul className="list-disc pl-5 mt-[4px]">
                      <li>Vehicle body condition (scratches/dents)</li>
                      <li>Tyres, lights, and mirrors</li>
                      <li>Battery charge level</li>
                      <li>Odometer reading</li>
                    </ul>
                  </li>
                  <li>
                    Small, regular wear and tear is acceptable. Any significant
                    damages may attract additional charges.
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-y-[8px]">
                <p className="font-bold text-[#222222]">
                  Step 6: Complete the Formal Handover
                </p>
                <ul className="mt-[8px] text-[#3A3A3A] flex flex-col list-disc pl-5 gap-y-[4px]">
                  <li>
                    Once the inspection is done, the hub staff will mark your
                    vehicle as returned.
                  </li>
                  <li>
                    You will receive an in-app confirmation of successful
                    drop-off.
                  </li>
                  <li>
                    A final invoice (if applicable) will be generated and sent
                    to your registered email ID.
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-y-[8px]">
                <p className="font-bold text-[#222222]">
                  Step 7: Need Assistance?
                </p>
                <ul className="mt-[8px] text-[#3A3A3A] flex flex-col list-disc pl-5 gap-y-[4px]">
                  <li>
                    If you are unable to visit the hub, you can request a
                    doorstep pickup directly from the website (service fees may
                    apply).
                  </li>
                  <li>
                    For any issues at the hub, tap Report Issue and our support
                    team will help you immediately.
                  </li>
                </ul>
              </div>
              <p className="text-[#3A3A3A] italic text-[14px]">
                By following these steps, you ensure a hassle-free return
                experience, avoid late charges, and complete your booking
                smoothly.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WhatToExpect;
