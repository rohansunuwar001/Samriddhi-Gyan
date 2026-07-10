import React from "react";
import { useGetCompanyLogosQuery } from "@/features/api/cmsApi";

const TrustedBySection = () => {
  const { data: logosData } = useGetCompanyLogosQuery({ active: "true" });

  const defaultLogos = [
    { image: 'https://cms-images.udemycdn.com/96883mtakkm8/3E0eIh3tWHNWADiHNBmW4j/3444d1a4d029f283aa7d10ccf982421e/volkswagen_logo.svg', name: 'Volkswagen logo' },
    { image: 'https://cms-images.udemycdn.com/96883mtakkm8/2pNyDO0KV1eHXk51HtaAAz/090fac96127d62e784df31e93735f76a/samsung_logo.svg', name: 'Samsung logo' },
    { image: 'https://cms-images.udemycdn.com/96883mtakkm8/3YzfvEjCAUi3bKHLW2h1h8/ec478fa1ed75f6090a7ecc9a083d80af/cisco_logo.svg', name: 'Cisco logo' },
    { image: 'https://cms-images.udemycdn.com/96883mtakkm8/23XnhdqwGCYUhfgIJzj3PM/77259d1ac2a7d771c4444e032ee40d9e/vimeo_logo_resized-2.svg', name: 'Vimeo logo' },
    { image: 'https://cms-images.udemycdn.com/96883mtakkm8/1UUVZtTGuvw23MwEnDPUr3/2683579ac045486a0aff67ce8a5eb240/procter_gamble_logo.svg', name: 'Procter & Gamble logo' },
    { image: 'https://cms-images.udemycdn.com/96883mtakkm8/1GoAicYDYxxRPGnCpg93gi/a8b6190cc1a24e21d6226200ca488eb8/hewlett_packard_enterprise_logo.svg', name: 'Hewlett Packard Enterprise logo' },
    { image: 'https://cms-images.udemycdn.com/96883mtakkm8/2tQm6aYrWQzlKBQ95W00G/c7aaf002814c2cde71d411926eceaefa/citi_logo.svg', name: 'Citi logo' },
    { image: 'https://cms-images.udemycdn.com/96883mtakkm8/7guDRVYa2DZD0wD1SyxREP/b704dfe6b0ffb3b26253ec36b4aab505/ericsson_logo.svg', name: 'Ericsson logo' },
  ];

  const logos = logosData?.logos?.length > 0 ? logosData.logos : defaultLogos;

  return (
    <section className="bg-white font-sans py-16 sm:py-24">
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <h2 className="text-center text-xl text-gray-600 mb-12">
          Trusted by over 16,000 companies and millions of learners around the world
        </h2>

        {/* Logo Cloud */}
        <div className="flex justify-center items-center flex-wrap gap-x-10 gap-y-8 md:gap-x-16">
          {logos.map((logo, idx) => (
            <div key={logo._id || idx} className="relative h-8 w-28 sm:h-10 sm:w-32">
              <img
                src={logo.image}
                alt={logo.name}
                className="
                  h-full w-full object-contain
                  filter grayscale 
                  opacity-60 
                  transition-all 
                  duration-300 
                  hover:grayscale-0 
                  hover:opacity-100
                "
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;