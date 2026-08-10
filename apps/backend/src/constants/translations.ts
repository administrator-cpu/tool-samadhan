export const STATIC_TRANSLATIONS: Record<string, Record<string, string>> = {

  // System Events
  TICKET_ASSIGNED: {
    en: "Ticket assigned to {{agentName}}",
    hi: "टिकट {{agentName}} को सौंपा गया"
  },
  STATUS_CHANGED: {
    en: "Status updated from {{oldStatus}} to {{newStatus}}",
    hi: "स्थिति {{oldStatus}} से बदलकर {{newStatus}} की गई"
  },

  TICKET_RCA_UPDATED: {
    en: "Root Cause Analysis submitted",
    hi: "मूल कारण विश्लेषण (RCA) सबमिट किया गया"
  },

  TICKET_CLOSED: {
    en: "Ticket automatically closed after 24 hours of resolution.",
    hi: "समाधान के 24 घंटे बाद टिकट स्वचालित रूप से बंद हो गया है।"
  },
  
  // Quick Replies
  qr_troubleshooting_45m: {
    en: "To expedite and prioritize the restoration of your services, we are performing detailed troubleshooting. The estimated resolution time is 45 minutes.",
    hi: "आपकी सेवाओं की बहाली में तेजी लाने और इसे प्राथमिकता देने के लिए, हम विस्तृत समस्या निवारण कर रहे हैं। अनुमानित समाधान समय 45 मिनट है।"
  },
  qr_outage_bharti_4h: {
    en: "We regret to inform you that the link is currently affected due to an outage in Bharti media. Our team is actively coordinating with the concerned team to expedite the restoration of services. The Estimated Restoration Time is 4hrs.",
    hi: "हमें आपको सूचित करते हुए खेद है कि भारती मीडिया में आउटेज के कारण लिंक वर्तमान में प्रभावित है। हमारी टीम सेवाओं की शीघ्र बहाली के लिए संबंधित टीम के साथ सक्रिय रूप से समन्वय कर रही है। अनुमानित बहाली का समय 4 घंटे है।",
  },
  qr_latency_optimal: {
    en: "Link was reported for high latency, after re-routing the traffic , latency was back to optimal.",
    hi: "लिंक पर उच्च लेटेंसी की समस्या रिपोर्ट की गई थी। ट्रैफ़िक को री-रूट करने के बाद, लेटेंसी वापस इष्टतम स्तर पर आ गई।",
  },
  qr_share_latency_logs: {
    en: "Kindly share the current and optimal latency logs with us for further troubleshooting.",
    hi: "कृपया आगे की समस्या निवारण प्रक्रिया के लिए वर्तमान और इष्टतम लेटेंसी के लॉग हमारे साथ साझा करें।",
  },
  qr_link_operational_main: {
    en: "Upon our investigation of the media, we have confirmed that the link is currently operational on the main path. Please verify and confirm the current status of the link on your end.",
    hi: "मीडिया की जांच के बाद, हमने पुष्टि की है कि लिंक वर्तमान में मेन पाथ पर चालू है। कृपया अपनी ओर से लिंक की वर्तमान स्थिति की जांच करें और पुष्टि करें।",
  },
  qr_media_verification_90m: {
    en: "We are currently coordinating with our Network Tier 2 team for end-to-end media verification. Rest assured, we will keep you informed with the latest updates as soon as they become available. The tentative Estimated Resolution Time is 90 min. We appreciate your patience during this process.",
    hi: "हम वर्तमान में एंड-टू-एंड मीडिया वेरिफिकेशन के लिए अपनी नेटवर्क टियर 2 टीम के साथ समन्वय कर रहे हैं। निश्चिंत रहें, जैसे ही कोई नया अपडेट उपलब्ध होगा, हम आपको सूचित करेंगे। संभावित अनुमानित समाधान समय 90 मिनट है। इस प्रक्रिया के दौरान आपके धैर्य के लिए हम आपकी सराहना करते हैं।",
  },
  qr_bts_access_2h: {
    en: "We have received your request for BTS access. Our team is currently working on it and will provide you with access within the next 2hr. Thank you for your patience and understanding.",
    hi: "हमें BTS एक्सेस के लिए आपका अनुरोध प्राप्त हुआ है। हमारी टीम वर्तमान में इस पर काम कर रही है और आपको अगले 2 घंटे के भीतर एक्सेस प्रदान करेगी। आपके धैर्य और समझ के लिए धन्यवाद।",
  },
  qr_no_alarms_resolved: {
    en: "We have performed troubleshooting at our end and as per our observation there are no alarms in the network. The Service Request is being resolved now. In case you still face the issue, you can reopen the Service Request by logging into our online portal.",
    hi: "हमने अपनी ओर से समस्या निवारण किया है और हमारे अवलोकन के अनुसार नेटवर्क में कोई अलार्म नहीं है। सर्विस रिक्वेस्ट का अब समाधान किया जा रहा है। यदि आपको अभी भी समस्या का सामना करना पड़ता है, तो आप हमारे ऑनलाइन पोर्टल पर लॉग इन करके सर्विस रिक्वेस्ट को फिर से खोल सकते हैं।",

  },
  qr_complaint_resolved_close: {
    en: "We are pleased to inform you that your complaint has been successfully resolved. With this, we are proceeding to close your complaint in our system. If you believe the issue has not been fully resolved or require any further assistance, then please reopen the ticket with 24 hrs. We would appreciate it if you could take a moment to share your feedback on portal of your experience with our support team. Your input is valuable and helps us improve our services.",
    hi: "हमें आपको यह सूचित करते हुए खुशी हो रही है कि आपकी शिकायत का सफलतापूर्वक समाधान कर दिया गया है। इसके साथ ही, हम अपने सिस्टम में आपकी शिकायत को बंद करने की प्रक्रिया आगे बढ़ा रहे हैं। यदि आपको लगता है कि समस्या पूरी तरह से हल नहीं हुई है या आपको किसी अतिरिक्त सहायता की आवश्यकता है, तो कृपया 24 घंटे के भीतर टिकट को फिर से खोलें। हम आपके आभारी होंगे यदि आप पोर्टल पर हमारी सपोर्ट टीम के साथ अपने अनुभव के बारे में अपनी प्रतिक्रिया साझा करने के लिए कुछ समय निकालें। आपकी प्रतिक्रिया हमारे लिए महत्वपूर्ण है और हमें अपनी सेवाओं को बेहतर बनाने में मदद करती है।",
  },
  qr_reviewing_details: {
    en: "This is to inform you that our concerned team is reviewing the details thoroughly to ensure an accurate and effective resolution. We appreciate your patience while we work on this.",
    hi: "आपको सूचित किया जाता है कि हमारी संबंधित टीम सटीक और प्रभावी समाधान सुनिश्चित करने के लिए सभी विवरणों की गहन समीक्षा कर रही है। इस पर कार्य करने के दौरान आपके धैर्य के लिए हम आपकी सराहना करते हैं।",
  },
  qr_outage_extreme_ix_4h: {
    en: "We regret to inform you that the link is currently affected due to an outage in Extreme IX. Our team is actively coordinating with the concerned team to expedite the restoration of services. The Estimated Restoration Time is 4hrs.",
    hi: "हमें आपको सूचित करते हुए खेद है कि Extreme IX में आउटेज के कारण लिंक वर्तमान में प्रभावित है। हमारी टीम सेवाओं की शीघ्र बहाली के लिए संबंधित टीम के साथ सक्रिय रूप से समन्वय कर रही है। अनुमानित बहाली का समय 4 घंटे है।",
  },
  qr_engineers_on_site_delayed: {
    en: "Field engineers are working on site to expedite the resolution of the outage. However, it is taking longer than previously anticipated timeline due to unforeseen reasons. We are in continuous touch with the team for faster restoration of the service. ERT is awaited.",
    hi: "आउटेज के समाधान में तेजी लाने के लिए फील्ड इंजीनियर साइट पर काम कर रहे हैं। हालांकि, कुछ अप्रत्याशित कारणों से समाधान में पहले के अनुमान से अधिक समय लग रहा है। सेवा की शीघ्र बहाली के लिए हम टीम के साथ लगातार संपर्क में हैं। ERT की प्रतीक्षा है।",
  }
};
