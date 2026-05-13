import Image from "next/image";
import AgentImage from "@/assets/agent.png";


export default function Timeline() {
    return (
        <section className="xl:col-span-2 px-10" data-purpose="ticket-timeline">

            <h2 className="font-heading text-2xl font-bold mb-8 text-gray-800 tracking-tight">Issue Timeline</h2>

            <div className="relative timeline-spine pl-6 sm:pl-10 pb-8">

                {/* Timeline Item: Ticket Created */}
                <div className="relative mb-12 timeline-item z-10">

                    {/* Node Dot */}
                    <div className="absolute -left-3 sm:-left-[48px] -top-1 w-10 h-10 rounded-full bg-primary-600 border-2 border-background flex items-center justify-center z-10 shadow-sm bg-gray-100">
                        <span className="material-symbols-outlined text-xl text-gray-500">robot_2</span>
                    </div>

                    <div className="mb-2">
                        <h3 className="font-heading font-semibold text-lg text-black flex items-center gap-2">Ticket Created</h3>
                    </div>

                    {/* Message Card */}
                    <div className={`flex w-full justify-start items-start`}>
                        <div className={"flex flex-col gap-3 pl-2"}>
                            <div className={`max-w-[80%] flex flex-col gap-3 justify-start items-start`}>
                                <div className="flex flex-col justify-start items-start gap-1  text-slate-500 mb-1 font-semibold leading-normal">
                                    <div className={"flex flex-row items-center gap-2"}>
                                        <span className="text-xs font-body font-semibold">Samadhan AI</span>
                                        <span className="text-xs font-body text-muted font-semibold ml-1">Oct 24, 10:43 AM</span>
                                    </div>
                                    <div className={`p-3 rounded-2xl shadow-xs bg-white border border-gray-200 rounded-tl-sm`}>
                                        <p className={"text-[15px] leading-relaxed font-body font-medium"}>We&apos;ve received your report. Your ticket has been assigned priority HIGH based on the connection drops. An agent will review this shortly.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>


                {/* Timeline Item: Agent Assigned & First Message */}
                <div className="relative mb-12 timeline-item z-10">

                    {/* Node Dot */}
                    <div className="absolute -left-3 sm:-left-[48px] -top-1 w-10 h-10 rounded-full bg-primary-600 border-1 border-background flex items-center justify-center z-10 shadow-sm bg-white">
                        <Image src={AgentImage} alt="" width={40} height={40} className={"rounded-full"}/>
                    </div>

                    <div className="mb-3">
                        <h3 className="font-heading font-semibold text-lg text-black">Agent Assigned</h3>
                    </div>

                    {/* Message Card */}
                    <div className={`flex w-full justify-start items-start pl-2`}>
                        <div className={`max-w-[80%] flex flex-col gap-3 justify-start items-start`}>
                            <div className="flex flex-col justify-start items-start gap-1  text-slate-500 mb-1 font-semibold leading-normal">
                                <div className={"flex flex-row items-center gap-2"}>
                                    <span className="text-xs font-body font-semibold">Sarah Jenkins</span>
                                    <span className="text-xs font-body text-primary font-semibold  bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">Support Agent</span>
                                    <span className="text-xs font-body text-muted font-semibold ml-1">Oct 24, 10:43 AM</span>
                                </div>
                                <div className={`p-3 rounded-2xl shadow-xs bg-white border border-gray-200 rounded-tl-sm`}>
                                    <p className={"text-[15px] leading-relaxed font-body font-medium"}> Hi there I&apos;m looking into this for you right now. I&apos;m running a remote diagnostic on your router.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col justify-start items-start gap-1  text-slate-500 mb-1 font-semibold leading-normal">
                                <div className={"flex flex-row items-center  gap-2"}>
                                    <span className="text-xs font-body font-semibold">Sarah Jenkins</span>
                                    <span className="text-xs font-body text-primary font-semibold  bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">Support Agent</span>
                                    <span className="text-xs font-body text-muted font-semibold ml-1">Oct 24, 10:43 AM</span>
                                </div>
                                <div className={`p-3 rounded-2xl shadow-xs bg-white border border-gray-200 rounded-tl-sm`}>
                                    <p className={"text-[15px] leading-relaxed font-body font-medium"}> Hi there I&apos;m
                                        looking into this for you right now. I&apos;m running a remote diagnostic on your
                                        router.
                                    </p>
                                </div>
                            </div>

                             <div className="flex flex-col justify-start items-start gap-1  text-slate-500 mb-1 font-semibold leading-normal">
                                <div className={"flex flex-row items-center  gap-2"}>
                                    <span className="text-xs font-body font-semibold">Samadhan AI</span>
                                    <span className="text-xs font-body text-muted font-semibold ml-1">Oct 24, 10:43 AM</span>
                                </div>
                                <div className={" flex flex-row items-center gap-2 p-3 rounded-2xl shadow-xs bg-gray-50 border border-gray-200 rounded-tl-sm"}>
                                    <span className="material-symbols-outlined text-xl text-gray-400">error</span>
                                    <p className={"text-[15px] text-gray-400 leading-relaxed font-body font-medium"}>Ticket Escalated to Senior Engineer for signal trace analysis.</p>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>



                {/* Timeline Item: Ticket Reassigned */}
                <div className="relative mb-12 timeline-item z-10">

                    {/* Node Dot */}
                    <div className="absolute -left-3 sm:-left-[48px] -top-1 w-10 h-10 rounded-full bg-primary-600 border border-background flex items-center justify-center z-10 shadow-sm ">
                        <Image className={"rounded-full z-10"}
                            src={"https://instagram.fdel27-1.fna.fbcdn.net/v/t51.82787-19/640411699_18326849236221661_2340588335215907201_n.jpg?efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fdel27-1.fna.fbcdn.net&_nc_cat=101&_nc_oc=Q6cZ2gFUli4UcF0d7RBhKjgWHsANwij9OaLrWFjGI2yba6IV1LHQV9DccbE8GQ2qP2CT_WziebC7C1-ERocD3879mNhJ&_nc_ohc=0DlKWONHq1EQ7kNvwFxwCfB&_nc_gid=B8qWTZwsrsc037YS6rYFbw&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_Af4TyVAhsL1tMuZ0GsZHdTeV6wZe2En0Kyl3tpm16NhbFQ&oe=6A00EBE4&_nc_sid=7a9f4b"}
                            alt={""} width={40} height={40}/>
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-700 opacity-75 z-1"/>

                    </div>

                    <div className="mb-3">
                        <h3 className="font-heading font-semibold text-lg text-black">Ticket Reassigned</h3>
                    </div>


                    {/* Message Card */}
                    <div className={`flex w-full justify-start items-start`}>
                        <div className={"flex flex-col gap-3 pl-2"}>
                            <div className={`max-w-[80%] flex flex-col gap-3 justify-start items-start`}>

                                <div className="flex flex-col justify-start items-start gap-1 text-slate-500 mb-1 font-semibold leading-normal">
                                    <div className={"flex flex-row items-center gap-2"}>
                                        <span className="text-xs font-body font-semibold">System</span>
                                        <span className="text-xs font-body text-muted font-semibold ml-1">Oct 24, 10:43 AM</span>
                                    </div>
                                    
                                </div>

                                <div className="flex flex-col justify-start items-start gap-1  text-slate-500 mb-1 font-semibold leading-normal">
                                    <div className={"flex flex-row items-center  gap-2"}>
                                        <span className="text-xs font-body font-semibold">Ashok Kumar</span>
                                        <span className="text-xs font-body text-primary font-semibold  bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">Support Engineer</span>
                                        <span className="text-xs font-body text-muted font-semibold ml-1">Oct 24, 10:43 AM</span>
                                    </div>
                                    <div className={`p-3 rounded-2xl shadow-xs bg-white border border-gray-200 rounded-tl-sm`}>
                                        <p className={"text-[15px] leading-relaxed font-body font-medium"}> Hi there I&apos;m looking into this for you right now. I&apos;m running a remote diagnostic on your router.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>




                    {/*// <!-- Timeline Item: Resolution Estimate (End of line) -->*/}
                    <div className="relative timeline-item z-10">
                        <div className="absolute -left-3 sm:-left-[40px] top-1 w-6 h-6 rounded-full bg-gray-200 border border-background flex items-center justify-center z-10 shadow-sm"></div>

                        <div className="absolute -left-3 sm:-left-[40px] top-1 w-6 h-6 rounded-full bg-gray-200 border border-background flex items-center justify-center z-10 shadow-sm">
                            <span className="relative flex h-4 w-4 items-center justify-center">
                                {/* Ping */}
                                {/* <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"/> */}
                                {/* Dot */}
                                <span className="relative inline-flex h-4 w-4 rounded-full border-4 border-white bg-amber-500 shadow-md"/>
                            </span>
                        </div>

                        <div className="mb-2">
                            <h3 className="font-heading font-semibold text-lg text-gray-400">Resolution Estimate</h3>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-gray-50 text-gray-400 px-4 py-2.5 rounded-tl-sm ">
                            <i className="ph ph-calendar-check text-lg"></i>
                            <span className="font-medium text-sm ">Expected by Oct 26, 12:00 AM</span>
                        </div>
                    </div>
                </div>
        </section>
);
}