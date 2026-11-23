# धाराशिव टुडे — स्वतंत्र न्यूज पोर्टल

धाराशिव टुडे हा स्वतंत्र GitHub Pages न्यूज पोर्टल आहे. दलालनामाच्या बातम्या, फोटो आणि इतर डेटा या फोल्डरमध्ये वापरलेले नाहीत.

## Live
- Website: https://dalalnama.com/DharashivToday/
- Admin: https://dalalnama.com/DharashivToday/admin/
- YouTube: https://www.youtube.com/@dharashivlive
- Repo folder: https://github.com/catonpe-droid/Dalalnama/tree/main/DharashivToday

## काय उपलब्ध आहे?
- मोबाइल / संगणक responsive homepage, TV-news-inspired navy-red color palette
- Breaking News ticker: 44px desktop, 40px mobile, red label / navy text, automatic scrolling
- Category navigation, search, all-news view, individual story URL, featured articles
- जिल्ह्यातील 8 तालुके, YouTube live stream embed (only while YouTube channel is broadcasting)
- Independent data/news.json, data/layout.json, data/media.json
- Admin Studio copied from the existing editor (news / drafts / media / site layout)
- GitHub Pages build generates per-article landing pages, metadata, sitemap

## बातम्या प्रसिद्ध करण्याची पद्धत
1. उघडा: /DharashivToday/admin/
2. Admin overlay साठी तुमचा वेगळा Login वापरा. **हा login फक्त browser-level overlay आहे; server-side authentication नाही.**
3. वास्तविक Publish/Edit करण्यासाठी GitHub Fine-Grained Personal Access Token आवश्यक आहे (Contents: Read & Write on catonpe-droid/Dalalnama). Token किंवा password वेबसाइटच्या public files मध्ये टाकू नका.
4. Admin > All News & Editor मध्ये बातमी + फोटो भरा; Publish/Update करा. GitHub Pages workflow build झाल्यावर URL live.
5. Admin > Appearance & Layout मध्ये menu, Breaking Headlines, Featured Slugs व इतर settings ठेवा. Breaking Headlines आणि menu पुढच्या site load वर apply होतात.

## Cloudflare secret-link पर्याय
`backend/dharashivtoday-editor-worker.js` हा स्वतंत्र publisher Worker template आहे. वेगळ्या Cloudflare Worker मध्ये deploy करून GITHUB_TOKEN आणि किमान 32-character PUBLISH_KEY secrets लावा. नंतर `admin/config.json` मधील `worker_url` अपडेट करा. **Worker deploy/configure केलेला नाही.** Dalalnama चा existing Worker इथे वापरू नका.

## महत्त्वाच्या टीपा
- लोगो: वापरकर्त्याने दिलेल्या मूळ PNG मधून बनवलेली 280px transparent, optimized PNG `assets/logo-original-hd.png` म्हणून वेबसाइट, footer आणि Admin मध्ये वापरली आहे. मूळ मोठ्या फाइलचा आकार बदललेला आहे; ब्रँडची चिन्हे बदललेली नाहीत.
- Live stream चालू नसताना YouTube embed unavailable दाखवू शकते; channel link fallback दिला आहे.
- बातम्या स्वतःहून तयार/कॉपी केलेल्या नाहीत. पहिले प्रकाशन Admin मधून करा.
- TV9 मराठी हे design inspiration आहे; content, logos, branding, आणि code स्वतंत्र आहेत.
