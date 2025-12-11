export default function Footer() {
  const footerLinks = {
    resources: [
      { name: 'Docs', href: '#docs' },
      { name: 'API', href: '#api' },
      { name: '블로그', href: '#blog' },
      { name: '튜토리얼', href: '#tutorials' },
    ],
    legal: [
      { name: '개인정보처리방침', href: '#privacy' },
      { name: '이용약관', href: '#terms' },
      { name: '보안', href: '#security' },
    ],
  };
  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <h3
              className="text-3xl font-bold mb-4"
              style={{ fontFamily: '"Pacifico", serif' }}
            >
              YALDI
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              AI가 먼저 그려주는 데이터 모델.
              <br />
              팀은 협업하며 완성합니다.
            </p>
            {/* <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 bg-white/10 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer"
                >
                  <i className={`${social.icon} text-lg`} />
                </a>
              ))}
            </div> */}
          </div>

          {/* Links Sections */}
          {/* <div>
            <h4 className="font-bold text-lg mb-4">제품</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-blue-400 transition-colors duration-300 cursor-pointer"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div> */}
          {/* 
          <div>
            <h4 className="font-bold text-lg mb-4">리소스</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-blue-400 transition-colors duration-300 cursor-pointer"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4">회사</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-blue-400 transition-colors duration-300 cursor-pointer"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div> */}

          <div>
            <h4 className="font-bold text-lg mb-4">법적 고지</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-blue-400 transition-colors duration-300 cursor-pointer"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2025 YALDI. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Made with IP</span>
          </div>
          <a
            href="https://readdy.ai/?origin=logo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-400 text-sm transition-colors duration-300 cursor-pointer"
          >
            Powered by IP
          </a>
        </div>
      </div>
    </footer>
  );
}
