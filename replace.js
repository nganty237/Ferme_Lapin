const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Replace class="panel ..."
            const panelRegex = /class="panel(\s+[^"]*)?"/g;
            content = content.replace(panelRegex, (match, modifiers) => {
                const mods = modifiers ? modifiers : '';
                return `class="bg-white border border-slate-200 rounded-xl p-6${mods}"`;
            });

            // Replace class="panel__title ..."
            const panelTitleRegex = /class="panel__title(\s+[^"]*)?"/g;
            content = content.replace(panelTitleRegex, (match, modifiers) => {
                const mods = modifiers ? modifiers : '';
                return `class="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2${mods}"`;
            });
            
            // Replace class="section-title ..."
            const sectionTitleRegex = /class="section-title(\s+[^"]*)?"/g;
            content = content.replace(sectionTitleRegex, (match, modifiers) => {
                const mods = modifiers ? modifiers : '';
                return `class="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2${mods}"`;
            });

            if (content !== originalContent) {
                // Find <tag class="text-base font-semibold ..."> ... </tag>
                // We'll use a regex that finds the opening tag and lazy matches to the next </p>, </h2>, </div>, or </h1>, etc.
                // Since we know the tags used are p or h2, let's match both.
                const titleBlockRegex = /(<[a-z0-9]+[^>]*class="text-base font-semibold text-slate-800[^"]*"[^>]*>)([\s\S]*?)(<\/[a-z0-9]+>)/gi;
                
                content = content.replace(titleBlockRegex, (match, p1, p2, p3) => {
                    let inner = p2.replace(/<mat-icon([^>]*)>/gi, (mIcon, attrs) => {
                        let newAttrs = attrs.replace(/\s*class="[^"]*"/g, '').trim();
                        if (newAttrs.length > 0) {
                           newAttrs = ' ' + newAttrs;
                        }
                        return `<mat-icon class="text-emerald-700"${newAttrs}>`;
                    });
                    return p1 + inner + p3;
                });

                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, 'src', 'app'));
