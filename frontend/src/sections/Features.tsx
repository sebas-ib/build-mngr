import { SatelliteDish, FolderArchive, ShieldCheck, LineChart, Smartphone, Users } from "lucide-react";

export const Features = () => {
  return (
    <section id="features" className="bg-[radial-gradient(ellipse_150%_100%_at_top_center,_#E0ECF8,_white_66%)] py-20 scroll-mt-10">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
          Everything You Need to Stay on Track
        </h2>
        <p className="text-[#4B5563] text-lg mt-4 max-w-2xl mx-auto">
          BuildManager simplifies how you manage tasks, collaborate with your team, and deliver projects — all in one place.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 mt-16">
          <FeatureItem
            title="Live Project Updates"
            description="Track progress in real time, with automatic updates as your team works."
            Icon={SatelliteDish}
          />
          <FeatureItem
            title="File & Media Sharing"
            description="Upload, view, and organize files — from blueprints to invoices."
            Icon={FolderArchive}
          />
          <FeatureItem
            title="Access Control"
            description="Set permissions so the right people see the right data."
            Icon={ShieldCheck}
          />
          <FeatureItem
            title="Activity Logs"
            description="Keep a history of changes to monitor accountability and progress."
            Icon={LineChart}
          />
          <FeatureItem
            title="Mobile Friendly"
            description="Work from the office, truck, or jobsite — wherever you are."
            Icon={Smartphone}
          />
          <FeatureItem
            title="Built for Teams"
            description="Invite team members and collaborate without friction."
            Icon={Users}
          />
        </div>
      </div>
    </section>
  );
};

const FeatureItem = ({
  title,
  description,
  Icon,
}: {
  title: string;
  description: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}) => {
  return (
    <div className="text-left p-6 bg-[#F9FAFB] rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
      <Icon className="text-[#0073BB] mb-4" size={32} />
      <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">{title}</h3>
      <p className="text-[#4B5563] text-sm">{description}</p>
    </div>
  );
};
