import { useEffect } from "react";

const PrivacyPolicyModal = ({ isOpen, onClose }) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[16px] w-[90vw] max-w-[800px] h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-[24px] border-b border-gray-200">
          <h2 className="text-[24px] font-bold text-black">Privacy Policy</h2>
          <button
            onClick={onClose}
            className="w-[40px] h-[40px] flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200 text-[20px]"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-[24px]">
          <div className="prose prose-sm max-w-none text-[14px] leading-[1.6] text-[#333]">
            <p className="text-[12px] text-gray-600 mb-4">
              BLive Rental App – Last updated: 29/09/2025
            </p>
            <p className="mb-4">
              We are committed to providing you with notice about how Arcis
              Clean Energy Pvt. Ltd. and our affiliate and subsidiary companies
              (together, “Blive” or “we”, or “us”, or “our”) handle your
              information. This BLive Privacy Policy (the “Privacy Policy”)
              applies to the information, that we collect and process about
              users of our Services, and those who communicate with us about our
              Services, interact with us on social media, attend our events,
              participate in our surveys, contests and promotions, or are
              subscribed to our marketing and informational communications (the
              “Interactions”). In this Privacy Policy, “Services” means: BLive
              websites that link to this Privacy Policy, including any versions
              optimized for viewing on a mobile device (the “Sites”), BLive
              mobile applications (each an “App”), BLive vehicles (each a
              “Vehicle”), and the features and services available through our
              Sites, Apps and Vehicles. We have established this Privacy Policy
              to let you know the kinds of information we may gather during your
              use of the Services and related other Interactions, how we use
              your information, when we might disclose your information and your
              rights and choices regarding your information that we collect and
              process.
            </p>
            <p className="mb-4">
              Arcis Clean Energy Pvt. Ltd. provides services to users throughout
              India as a data processor, processing personal data on behalf of
              fleet operators (the data controllers) without determining the
              purposes or means of such processing, and not acting in any
              fiduciary capacity.
            </p>
            <p className="mb-4">
              This Privacy Policy contains the following sections:{" "}
            </p>
            <p className="mb-4">
              The Information We Collect, Use and Processing of Information,
              Disclosure of Your Information, Use of Cookies and Other Online
              Tracking Technologies, Online Advertising, How We Protect Your
              Information, Retention of Your Information, International Users,
              Third Party Links and Services, Changes to this Privacy Policy,
              Your Choices, Data Subject Rights, Privacy Information for Indian
              Residents, Contact Information.
            </p>
            <p className="mb-4">THE INFORMATION WE COLLECT</p>
            <p className="mb-4">
              We collect information related to our Services and Interactions
              directly from users, automatically related to their use of the
              Services and our Interactions, as well as from third parties. We
              may combine the information we collect from these various sources.
            </p>
            <p className="mb-4">
              Information You Provide to Us. We collect information directly
              from users: Account registration, management, profile creation and
              modification, Account access and use, as well as uploading content
              to the Services and other associated activities, Vehicle use,
              Access to and use of the Sites and Apps Submission of payment
              information, Event registration and attendance, Participation in
              surveys, contests, sweepstakes and promotions sponsored by BLive,
              Signing up to receive alerts or other information via email, text
              or instant messages from BLive, Customer service, technical
              support, and related communications, Participation in communities,
              commenting on blog entries, interacting with use on social media,
              and participation in other forums, Submission of an application or
              resume to work at BLive. The types of information we collect
              directly from you are: your name, e-mail address, phone number,
              postal address, other contact information, credit card and billing
              details, including billing address, communications preferences,
              payment and transaction history, where required your birthdate and
              driver’s license information or other identification card, and any
              other information you submit to the Services or otherwise provide
              to us. We also collect certain demographic data if you provide it
              to us including age, gender, preferred language, and current
              location.
            </p>
            <p className="mb-4">
              Automatically Collected Information. We also collect information
              through automated and technical means as you browse our Sites, use
              our Apps, or otherwise use the Services:
            </p>
            <p className="mb-4">
              Device and Online Usage. We collect information about your
              computer, browser, mobile or other device that you use to access
              the Services. We may use cookies, pixels, log files and other
              similar technologies to collect such information, including IP
              address, device identifiers and other unique identifiers, browser
              type, browser language, operating system name, and version, device
              name and model, version, referring and exit pages, dates and times
              you access our Services, the length of time that you are logged
              into or using our Services, the links you click or features you
              use, software crash reports and session identification number.
              Please see the “Use of Cookies and Other Online Tracking
              Technologies” section below or our Cookie Notice for more
              information.{" "}
            </p>
            <p className="mb-4">
              Location Info and Vehicle Usage. We automatically collect and
              store location information from your device and from any Vehicles
              you use. We collect and store the location information (e.g.,
              city, state or zip code where available) associated with the IP
              address of the device you use to access the Services, as well as,
              with your permission, your mobile device’s location information
              using GPS or Bluetooth (you can change your location/Bluetooth
              settings for your mobile device; however, certain features may not
              be available through the App if you do so).
            </p>
            <p className="mb-4">
              Analytics: We compile and analyze information derived from the use
              of our Services, such as aggregate usage patterns, user
              preferences, peak demand times, common routes and other
              information.
            </p>
            <p className="mb-4">
              Information We Collect From Third Party Sources. In some cases, we
              collect user information from third parties.
            </p>
            <p className="mb-4">
              Third Party Platforms and Social Media Sites. When you interact
              with us or post content about us on third-party social media
              platforms – like Facebook, Twitter, Google+, Tumblr, LinkedIn,
              YouTube or Pinterest – we may collect certain information about
              that interaction; the information that we may collect is based on
              your settings on and the policies of these social media platforms.
              We may also allow you to post certain information from these
              platforms to your BLive profile, and permit you to login to the
              Services using your third-party social media account, in which
              case you will be asked to consent to our access and collection of
              certain information from your social media profile, subject to the
              policies of that platform.
            </p>
            <p className="mb-4">
              Other Third-Party Sources. We also may collect information about
              you that we may receive from business partners, marketers,
              analysts and other sources to, enable us to verify and update
              information contained in our records and better customize the
              Services for you. We may also collect information from credit
              reporting agencies to determine your creditworthiness, credit
              score and credit usage, in compliance with and to the extent
              permitted by applicable laws.
            </p>
            <p className="mb-4">
              Referrals. We may from time to time conduct a referral service so
              that you may introduce people you know to our Services, in
              accordance with applicable local laws. If you choose to use our
              referral service to tell someone about our Services, we will
              provide you with a template message and referral code to send to
              your friend. We will not collect the referral’s information unless
              he/she signs up to use the Services with the referral code.
            </p>
            <p className="mb-4">USE AND PROCESSING OF INFORMATION</p>
            <p>
              We generally use the information we collect from and about you to
              provide and operate the Services, respond to user requests, for
              customer service and support, to protect our rights and those of
              others, to send marketing communications, to help us personalize
              user experiences and to improve the Services, as explained in more
              detail below.
            </p>
            <p className="mb-4">
              Legal Bases for Processing Under Indian Law. Where India’s data
              protection law applies, we process your personal data as defined
              by applicable law for the purposes set out in the table below,
              under the following legal bases:
            </p>
            <p className="mb-4">
              Our Contract With You. Our processing is necessary to perform our
              obligations under a contract with you or to perform steps
              requested by you prior to entering into a contract with you (e.g.,
              to verify the information you have provided to us and provide the
              Services to you).
            </p>
            <p className="mb-4">
              Our Legitimate Interests. Our processing is necessary for our
              legitimate interests, including to protect the security of our
              Services; to protect the health and safety of others; to
              establish, protect and defend our legal rights and interests; to
              monitor and protect our Vehicles; to prevent fraud and verify
              identity and authorization of users; to personalize user
              experiences and content; to understand and analyze usage trends;
              and to improve the Services.
            </p>
            <p className="mb-4">
              Legal Compliance. Where our processing is required to comply with
              applicable law (for example, to maintain your payment transaction
              history for tax reporting purposes).
            </p>
            <p className="mb-4">
              Your Consent. When we have your consent as defined by applicable
              law. In addition, we may process information to the extent
              necessary to protect the health, safety or vital interests of any
              person and to establish, protect and defend our legal rights.
            </p>
            <p className="mb-4">Purpose of Use and Processing.</p>
            <p className="mb-4">
              Generally, we use the information we collect as set forth in the
              below table:
            </p>
            <p className="mb-4">
              Purposes of Use and Processing of Information
            </p>
            <p className="mb-4">Providing Support and Services:</p>
            <p className="mb-4">
              To provide and operate the Services and related features, fulfill
              your orders and requests and to process your payments <br /> To
              update the Services <br /> To track Vehicles, including location,
              battery levels and rental status <br /> To permit you to update,
              edit, and manage your content <br /> To communicate with you about
              your use of the Services and respond to your inquiries and
              complaints <br />
              For troubleshooting, technical and customer service and support
              purposes Verification
            </p>
            <p className="mb-4">
              To verify the identity of users, applicants and others with whom
              we interact <br /> To confirm authorization of users that access
              and use the Services Improve Services and Analytics
            </p>
            <p className="mb-4">
              To create anonymous or aggregate information <br /> To optimize or
              improve our products, services and operations <br /> To perform
              statistical, demographic, and marketing analyses of our users, to
              analyze and understand usage and activity trends, demographic
              trends and for other research, analytical, and statistical
              purposes <br /> Communicate with you about your account or
              transactions with us (including Services-related announcements) or
              your comments to a blog post.
            </p>
            <p className="mb-4">
              To communicate with you about changes to our policies <br />
              Personalize Services and Ads
            </p>
            <p className="mb-4">
              To personalize content and experiences on our Services, including
              providing you reports, recommendations, and feedback based on your
              preferences, and to use your location information for
              personalization purposes. <br /> To better target ads so that
              users receive ads that are relevant to them. Marketing and
              Promotions
            </p>
            <p className="mb-4">
              To send you information, news, updates and offers about us or our
              Services (subject to your consent where required by applicable
              law) <br /> For other direct marketing and promotional purposes{" "}
              <br /> To protect the Services and our business operations <br />{" "}
              To detect, investigate, prevent or take action regarding illegal
              activities, misuse, suspected fraud or situations involving
              potential threats to the safety or legal rights of any person or
              entity, and as evidence in litigation <br /> To investigate,
              enforce and prevent violations of our policies and terms
              (including this Privacy Policy, our Terms of Use and Rental
              Agreement) <br /> As otherwise necessary to establish, protect and
              defend our legal rights Complying with Legal Obligations
            </p>
            <p className="mb-4">
              To comply with the law <br /> To respond to legal process or
              enforcement or legal process requests, e.g. in response to
              summons, court orders and other lawful requests by regulators,
              courts and law enforcement agencies, or related to national
              security requests. General Business Operations
            </p>
            <p className="mb-4">
              Where necessary for the administration of our general business,
              accounting, recordkeeping and legal functions as part of our
              routine business administration, such as employee training,
              compliance auditing and similar internal activities
            </p>
            <p className="mb-4">DISCLOSURE OF YOUR INFORMATION</p>
            <p className="mb-4">
              We disclose the information we collect, in the following ways:
            </p>
            <p className="mb-4">Affiliates and Subsidiaries.</p>
            <p>
              Amongst our affiliated and subsidiary companies in furtherance of
              the purposes set out in this Policy; their use of your information
              is subject to this Privacy Policy.{" "}
            </p>
            <p className="mb-4">
              Business Partners and Third Parties. We may share your information
              with business partners who jointly sponsor events with us, from
              time to time; where required by applicable law, we will obtain
              your prior consent. You may at any time withdraw your consent or
              tell us to stop sharing your personal information (as defined
              under applicable law) with business partners and third parties by
              following the opt-out process described in the “Your Choices”
              section below. If you use the Services through a third-party
              platform that manages its own fleet of BLive vehicles, we will
              also share your information with the platform operator to assist
              in operating the Services.
            </p>
            <p className="mb-4">
              Third-Party Service Providers. We use a variety of third party
              service providers that perform functions on our behalf, such as
              hosting, billing and payment processing, push notifications,
              storage, bandwidth, content management tools, analytics, customer
              service, fraud protection, etc.
            </p>
            <p className="mb-4">
              General Business Operations. Where necessary to the administration
              of our general business, accounting, record keeping and legal
              functions, to our tax advisors, legal counsel and other
              professional services entities or agents.
            </p>
            <p className="mb-4">
              Legal Compliance and Protection of Rights. We may also use or
              disclose information if required to do so by law or in the
              good-faith belief that such action is necessary to (a) conform to
              applicable law or comply with legal process served on us or the
              Services; (b) establish, protect and defend our rights or
              property, the Services or our users, including to investigate,
              prevent or take action regarding illegal activities, suspected
              fraud, situations involving potential threats to the safety of any
              person, violations of our Terms of Use, Rental Agreement, other
              agreements or policies, or as evidence in litigation in which we
              are involved; and (c) act under emergency circumstances to protect
              the personal safety of us, our affiliates, agents, or users of the
              Services or the public. This includes exchanging information with
              other companies and organizations for fraud protection.
            </p>
            <p className="mb-4">
              Other Users. Certain features of our Services make it possible for
              you to share comments publicly with other users. Any information
              that you submit through such features is not confidential and may
              be accessed by others. For example, if you submit a product review
              on one of our Sites, we may display your review (along with the
              name provided, if any) on other Blive Sites and on third-party
              websites. Moreover, if you provide a comment on our blog, other
              blog readers will be able to review your comments, and if you
              interact with us on our social media pages, your comments will be
              publicly available. So, please take care when using these
              features. If you’d like to request removal of information that we
              have posted about you, please contact us as set forth in the “Your
              Choices” section below.
            </p>
            <p className="mb-4">
              Aggregate/Anonymous Information. We may share aggregate/anonymous
              information about use of the Services with third parties for
              research, marketing, analytics and other purposes, provided such
              information does not identify a particular individual, such as by
              publishing a report on usage trends. The sharing of such data is
              unrestricted.
            </p>
            <p className="mb-4">
              Business Transfers. As we continue to develop our business, we may
              seek to buy, merge, or partner with other companies. In such
              transactions, (including in contemplation of such transactions)
              user information may be among the transferred assets.
            </p>
            <p className="mb-4">
              If a portion or all of our assets are sold or transferred to a
              third party, customer information would likely be one of the
              transferred business assets. If such transfer is subject to
              additional mandatory restrictions under applicable laws, we will
              comply with such restrictions.
            </p>
            <p className="mb-4">
              To request more information about the companies to whom we have
              disclosed your information, please contact us as set out in the
              “Contact Information” section.
            </p>
            <p className="mb-4">
              USE OF COOKIES AND OTHER ONLINE TRACKING TECHNOLOGIES
            </p>
            <p className="mb-4">
              Like most Sites and Apps and online Services, we use “cookies,”
              web beacons (a/k/a pixel tags), analytics devices and similar
              technologies (some of which are operated by third parties) to
              record your preferences, gather information about the use of our
              Services, personalize content and ads and track information about
              the performance of our advertisements. We may also use these
              technologies to monitor traffic and make the Services easier
              and/or more relevant for your use. We may combine this information
              with other information we collect from you.
            </p>
            <p className="mb-4">
              Cookies. These are alphanumeric identifiers that we transfer to
              your device’s hard drive through your web browser for
              record-keeping purposes and associate with small text files that
              we use to record certain information regarding your use of our
              online Services, your preferences and actions, and other device
              and usage data as described above. Some cookies allow us to make
              it easier for you to navigate our Sites, Apps, and Services, while
              others are used to enable a faster log-in process, personalize
              your use of the Services, or otherwise allow us to track your
              activities while using our Services. Many web browsers
              automatically accept cookies, but you can usually modify your
              browser’s setting to decline or block cookies if you prefer. If
              you delete your cookies or if you set your browser or device to
              decline or block these technologies, some features of the Services
              may not work or may not work as designed.
            </p>
            <p className="mb-4">
              Pixel tags (a/k/a web beacons or clear GIFs). Pixel tags are tiny
              graphics with a unique identifier, similar in function to cookies,
              which are embedded invisibly on web pages or within emails. We or
              our service providers may use pixel tags in connection with our
              Services to, among other things, track the activities of users of
              the Site and App, help manage content, measure ad performance and
              compile statistics about usage. We or our service providers also
              use pixel tags in HTML emails to our customers to help us track
              email response rates, identify when our emails are viewed, and
              track whether our emails are forwarded.
            </p>
            <p className="mb-4">
              Analytics Services. We use third-party analytics services,
              including Google Analytics, a web analytics service provided by
              Google, Inc. (“Google”), on our Services. Google Analytics uses
              cookies and other tracking technologies to help us analyze how
              users interact with and use the Services, compile reports on
              user’s’ activity, and provide other services related to activity
              and usage. The technologies used by Google may collect information
              such as your IP address, time of visit, whether you are a return
              visitor, and any referring website or app. To learn more about
              Google’s analytics services and to learn how to opt out of
              tracking of analytics by Google click here.
            </p>
            <p className="mb-4">ONLINE ADVERTISING</p>
            <p className="mb-4">
              In order to display more relevant advertising on our Services, to
              manage our advertising on third-party sites, mobile apps and
              online services, and to measure and improve our ads and marketing
              efforts, we may work with Facebook, Google and other third-party
              ad companies, ad exchanges, channel partners, measurement services
              and ad networks. Please see the “Use of Cookies and Other Online
              Tracking Technologies” section below or our Cookie Notice for more
              information.
            </p>
            <p className="mb-4">
              These third parties may use cookies, web beacons or other tracking
              technologies to collect information about your use of the Services
              and your activities across other websites and online services,
              which they may associate with persistent identifiers. This
              information may be used to provide you with more relevant
              advertising or other targeted content on our Services and other
              websites or services, and to measure the performance of such
              advertising. Their activities and your choices regarding their use
              of your information to personalize ads to you are subject to and
              set out in their own policies.{" "}
            </p>
            <p className="mb-4">
              You can learn about your options to opt-out of mobile app tracking
              by certain advertising networks through your device settings. For
              more information about how to change these settings for Android or
              Windows devices, see:
            </p>
            <p className="mb-4">
              Android:{" "}
              <a
                href="http://www.google.com/policies/technologies/ads/"
                target="_blank"
                rel="noopener noreferrer"
              >
                http://www.google.com/policies/technologies/ads/
              </a>{" "}
            </p>
            <p className="mb-4">
              Windows:{" "}
              <a
                href="http://choice.microsoft.com/en-US/opt-out"
                target="_blank"
                rel="noopener noreferrer"
              >
                http://choice.microsoft.com/en-US/opt-out
              </a>
            </p>
            <p className="mb-4">
              Please note that opting-out of advertising network services does
              not mean that you will not receive advertising while using our
              Services or other services, nor will it prevent the receipt of
              interest-based advertising from third parties that do not
              participate in these programs.
            </p>
            <p className="mb-4">
              Do-Not-Track. Your browser or device may include “Do-Not-Track”
              settings or functionality. Currently, our systems do not recognize
              browser “Do-Not-Track” requests. BLive’s information collection
              and disclosure practices, and the choices that we provide to
              customers, will continue to operate as described in this Privacy
              Policy, whether or not a Do-Not-Track signal is received. However,
              you may disable certain tracking on our Sites, as discussed in
              this section (e.g. by disabling cookies), and you may opt-out of
              certain third party ad networks as described below. For more
              information about Do-Not-Track signals, please click here.
            </p>
            <p className="mb-4">HOW WE PROTECT YOUR INFORMATION </p>
            <p className="mb-4">
              We take technical, physical and organizational security measures
              to protect your information against accidental or unlawful
              destruction or accidental loss, alteration, unauthorized
              disclosure or access. However, no method of transmission over the
              Internet, and no means of electronic or physical storage, is
              absolutely secure. We encourage you to take steps to protect your
              information and prevent unauthorized access to your password or
              account by, among other things, signing off after using a shared
              computer, choosing a robust password that nobody else knows or can
              easily guess, and keeping your log-in and password private. We are
              not responsible for any lost, stolen, or compromised passwords, or
              for any activity on your account via unauthorized password
              activity.
            </p>
            <p className="mb-4">RETENTION OF YOUR INFORMATION</p>
            <p className="mb-4">
              We retain your information a for as long as required to satisfy
              the purpose for which it is collected and used (for example, for
              the time necessary for us to provide you with customer service,
              answer queries or resolve technical problems), unless a longer
              period is necessary for our legal obligations or to establish,
              protect, or defend legal claims.
            </p>
            <p className="mb-4">THIRD PARTY LINKS AND SERVICES</p>
            <p className="mb-4">
              The Services contain links to third-party websites such as social
              media sites, and also contain third-party plug-ins and
              functionalities (such as the Facebook “like” button and Twitter
              “follow” button). If you choose to use these sites or features,
              you may disclose your information not just to those third parties,
              but also to their users and the public more generally depending on
              how their services function. We are not responsible for the
              content or practices of those websites or services. The
              collection, use, and disclosure of your information will be
              subject to the privacy policies of the third-party websites or
              services, and not this Privacy Policy. We urge you to read the
              privacy and security policies of these third parties.
            </p>
            <p className="mb-4">YOUR CHOICES</p>
            <p className="mb-4">
              If you would like to update your preferences on the types of
              communications you receive from us, or opt out of marketing
              communications from us, you may do so at any time by updating the
              communication preferences in your account profile. Please note
              that we may continue to send non-promotional communications such
              as important notices, payment confirmations and
              transaction-related emails and other information about your use of
              the Services. If you would like to opt-out of (i) marketing
              communications, or (ii) being included in any Custom Audience
              campaigns (see the “Online Advertising” section above for more
              information), you may also do so by emailing us your request at
              info@blive.co.in
            </p>
            <p className="mb-4">DATA SUBJECT RIGHTS</p>
            <p className="mb-4">
              Subject to applicable laws, you may have the following rights:
            </p>
            <p className="mb-4">
              To obtain access to and/or a copy of certain information we hold
              about you <br />
              To obtain, in certain circumstances, a copy of certain information
              we of yours in a structured, commonly used and machine readable
              format, and to ask us to transfer this to a third party of your
              choice <br />
              To request that we update your information we hold that is out of
              date or incorrect <br />
              To request that we delete certain information we hold about you{" "}
              <br />
              To request that we restrict the way we process and disclose
              certain of your information <br />
              To revoke your consent for the processing of your information, to
              the extent our processing of your information is not based on
              another legal basis <br />
              To object to certain processing of your information as follows:{" "}
              <br />
              Right to object to direct marketing: you may object to our
              processing of your information for direct-marketing purposes
              (including any direct marketing processing based on profiling).
              See “Your Choices” above for more info.
            </p>
            <p className="mb-4">
              Right to object to processing (including profiling) based on
              legitimate interest grounds: in addition where we are relying upon
              our legitimate interests to process information, you may object to
              that processing. If you object, we must stop that processing
              unless we can demonstrate compelling legitimate grounds for the
              processing that override your interests, rights and freedoms, or
              we need to process the information for the establishment, exercise
              or defense of legal claims. We will consider each case on an
              individual basis.
            </p>
            <p className="mb-4">
              You may exercise your rights or make a request regarding your
              information held by us, request further information about your
              legal rights under applicable law, or submit a complaint about our
              privacy practices by contacting us at any time, using the contact
              details set forth in the “Contact Information” section below. You
              may also access and modify much of the information that you have
              submitted by logging into your account and updating your profile.
              Please note that copies of information that you have updated,
              modified, or deleted may remain viewable in cached and archived
              pages of the Sites or Apps for a period of time. In addition, we
              may retain certain information about you as required by law or as
              permitted by law for legitimate business purposes. For example, if
              you request that we delete your information but we believe that
              you have violated our Terms of Use, we may retain information
              about you in order to attempt to resolve the issue before deleting
              it. Moreover, you will not be permitted to examine the information
              of any other person or entity. We will consider all requests and
              provide our response within the time period stated by applicable
              law. We also may request you provide us with information necessary
              to confirm your identity before responding to your request.
            </p>
            <p className="mb-4">Complaints.</p>
            <p className="mb-4">
              If applicable, you may make a complaint to the privacy regulator
              or supervisory authority in the place where you are based.
              Alternatively, you may seek a remedy through local courts if you
              believe your rights have been breached.
            </p>
            <p className="mb-4">
              Categories of personal information we collect are:
            </p>
            <p className="mb-4">
              Identifiers (such as name, address, email address); Commercial
              information (such as transaction data); Financial data (such as
              credit card information collected by our payment processors on our
              behalf); Internet or other network or device activity (such as
              browsing history or usage information); Geo-location information
              (e.g., your approximate location based on IP address, or precise
              location with your consent); Inference data about you (e.g., the
              additional services we think would be of most interest to you
              based on your interactions with us); demographic information (such
              as gender and age); insurance (including health insurance)
              information other information that identifies or can be reasonably
              associated with you.{" "}
            </p>
            <p className="mb-4">
              How we source, use, and share these categories of personal
              information:
            </p>
            <p className="mb-4">
              We source, use, and share the categories of personal information
              we collect from and about you consistent with the various business
              purposes we discuss throughout this Policy. See the “Information
              We Collect,” “Use and Processing of Information,” and “Disclosure
              of Your Information” section(s) above for more information. Inform
              you about the categories of personal information we collect or
              disclose about you; the categories of sources of such information;
              the business or commercial purpose for collecting your personal
              information; and the categories of third parties with whom we
              share/disclose personal information. Provide access to and/or a
              copy of certain personal information we hold about you. Delete
              certain personal information we have about you. Provide you with
              information about the financial incentives that we offer to you,
              if any.
            </p>
            <p className="mb-4">LIMITATION OF LIABILITY</p>
            <p className="mb-4">
              Arcis Clean Energy Pvt. Ltd. shall not be liable for any misuse,
              unauthorized access, or improper handling of personal data by the
              fleet operators or any third parties. As a data processor, Arcis
              Clean Energy Pvt. Ltd. operates solely on the instructions
              provided by the fleet operators and does not have control over the
              purposes for which the data is collected, how it is utilized, or
              any subsequent management of the data. Consequently, any actions
              taken by the fleet operators or third parties concerning the
              personal data are beyond the scope of Arcis Clean Energy Pvt.
              Ltd.’s authority or responsibility. Users acknowledge that Arcis
              Clean Energy Pvt. Ltd. is not responsible for any direct,
              indirect, incidental, or consequential damages arising from any
              misuse of personal data, and users agree to indemnify hold Arcis
              Clean Energy Pvt. Ltd. harmless from any claims or liabilities
              resulting from such misuse or unauthorized actions by fleet
              operators or third parties.
            </p>
            <p className="mb-4">CHANGES TO THIS PRIVACY POLICY</p>
            <p className="mb-4">
              Arcis Clean Energy Pvt. Ltd. reserves the right to amend this
              Privacy Policy at any time to reflect changes in the law, our data
              processing practices, the features of our Services, or advances in
              technology. The revised Privacy Policy will be made accessible
              through the Services, along with an updated “Effective Date.” If
              any material changes are made to this Privacy Policy that affect
              how personal data is processed, appropriate notice will be
              provided to users in accordance with legal requirements. It is
              important to note that, as a data processor, Arcis Clean Energy
              Pvt. Ltd. processes personal data solely in accordance with the
              instructions received from the fleet operators and does not
              determine the purposes for which the data is collected or used. By
              continuing to use the Services, you confirm that you have read and
              understood the latest version of this Privacy Policy.
            </p>
            <p className="mb-4">CONTACT INFORMATION</p>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, would like to
              exercise your rights regarding your information that we hold, or
              would like to raise a complaint with us related to your
              information, you should contact us at: contact@blive.co.in
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-[24px] flex justify-end">
          <button
            onClick={onClose}
            className="px-[24px] py-[12px] bg-[#000000] text-white font-medium text-[14px] rounded-[24px] hover:bg-[#333333] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
