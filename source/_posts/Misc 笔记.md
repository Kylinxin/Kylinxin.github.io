---
title: "常见文件文件头和隐写术总结 CTF中Misc必备"
date: 2023-07-30 15:14:29
updated: 2023-07-30 15:14:29
categories:
  - "Misc"
tags:
  - "misc"
abbrlink: "Misc 笔记"
---

<h1 id="Misc"><a href="#Misc" class="headerlink" title="Misc"></a>Misc</h1><h2 id="常见文件文件头和隐写术总结-CTF中Misc必备"><a href="#常见文件文件头和隐写术总结-CTF中Misc必备" class="headerlink" title="常见文件文件头和隐写术总结 CTF中Misc必备"></a><strong>常见文件文件头和隐写术总结 CTF中Misc必备</strong></h2><h3 id="前言"><a href="#前言" class="headerlink" title="前言"></a><strong>前言</strong></h3><p>对常见文件文件头和隐写术做个归纳总结</p>
<ul>
<li>文件头文件尾</li>
<li>图片隐写</li>
<li>音频隐写</li>
<li>电子文档隐写</li>
</ul>
<h3 id="一、文件头文件尾"><a href="#一、文件头文件尾" class="headerlink" title="一、文件头文件尾"></a><strong>一、文件头文件尾</strong></h3><h4 id="1、图片"><a href="#1、图片" class="headerlink" title="1、图片"></a><strong>1、图片</strong></h4><ul>
<li>JPEG 文件头：<code>FF D8 FF</code>  文件尾：<code>FF D9</code></li>
<li>TGA 未压缩的前4字节 <code>00 00 02 00</code> RLE压缩的前5字节 <code>00 00 10 00 00</code></li>
<li>PNG 文件头：<code>89 50 4E 47 0D 0A 1A 0A</code>  文件尾：<code>AE 42 60 82</code></li>
<li>GIF 文件头：<code>47 49 46 38 39(37) 61</code>  文件尾：<code>00 3B</code></li>
<li>BMP 文件头：<code>42 4D</code> 文件头标识(2 bytes) 42(B) 4D(M)</li>
<li>TIFF (tif) 文件头：<code>49 49 2A 00</code></li>
<li>ico 文件头：<code>00 00 01 00</code></li>
<li>Adobe Photoshop (psd) 文件头：<code>38 42 50 53</code></li>
</ul>
<h4 id="2、office文件"><a href="#2、office文件" class="headerlink" title="2、office文件"></a><strong>2、office文件</strong></h4><ul>
<li>MS Word/Excel (xls.or.doc) 文件头：<code>D0 CF 11 E0</code></li>
<li>MS Access (mdb) 文件头：<code>53 74 61 6E 64 61 72 64 20 4A</code></li>
<li>WordPerfect (wpd) 文件头：<code>FF 57 50 43</code></li>
<li>Adobe Acrobat (pdf) 文件头：<code>25 50 44 46 2D 31 2E</code></li>
<li>application/vnd.visio(vsd) 文件头：<code>D0 CF 11 E0 A1 B1 1A E1</code></li>
<li>Email [thorough only] (eml) 文件头：<code>44 65 6C 69 76 65 72 79 2D 64 61 74 65 3A</code></li>
<li>Outlook Express (dbx) 文件头：<code>CF AD 12 FE C5 FD 74 6F</code></li>
<li>Outlook (pst) 文件头：<code>21 42 44 4E</code></li>
<li>Rich Text Format (rtf) 文件头：<code>7B 5C 72 74 66</code></li>
<li>txt 文件(txt) 文件头：Unicode：<code>FE FF</code> / Unicode big endian：<code>FF FE</code> / UTF-8：<code>EF BB BF</code> /ANSI编码是没有文件头的</li>
</ul>
<h4 id="3、压缩包文件"><a href="#3、压缩包文件" class="headerlink" title="3、压缩包文件"></a><strong>3、压缩包文件</strong></h4><ul>
<li>ZIP Archive (zip) 文件头：<code>50 4B 03 04</code> 文件尾：<code>50 4B</code></li>
<li>RAR Archive (rar) 文件头：<code>52 61 72 21</code></li>
</ul>
<h4 id="4、音频文件"><a href="#4、音频文件" class="headerlink" title="4、音频文件"></a><strong>4、音频文件</strong></h4><ul>
<li>Wave (wav) 文件头：<code>57 41 56 45</code></li>
<li>audio(Audio) 文件头： <code>4D 54 68 64</code></li>
<li>audio/x-aac（aac）</li>
<li>文件头：<code>FF F1(9)</code></li>
</ul>
<h4 id="5、视频文件"><a href="#5、视频文件" class="headerlink" title="5、视频文件"></a><strong>5、视频文件</strong></h4><ul>
<li>AVI (avi) 文件头：<code>41 56 49 20</code></li>
<li>Real Audio (ram) 文件头：<code>2E 72 61 FD</code></li>
<li>Real Media (rm) 文件头：<code>2E 52 4D 46</code></li>
<li>MPEG (mpg) 文件头：<code>00 00 01 BA(3)</code></li>
<li>Quicktime (mov) 文件头：<code>6D 6F 6F 76</code></li>
<li>Windows Media (asf) 文件头：<code>30 26 B2 75 8E 66 CF 11</code></li>
<li>MIDI (mid) 文件头：<code>4D 54 68 64</code></li>
</ul>
<h4 id="6、代码文件"><a href="#6、代码文件" class="headerlink" title="6、代码文件"></a><strong>6、代码文件</strong></h4><ul>
<li>XML (xml) 文件头：<code>3C 3F 78 6D 6C</code></li>
<li>HTML (html) 文件头：<code>68 74 6D 6C 3E</code></li>
<li>Quicken (qdf) 文件头：<code>AC 9E BD 8F</code></li>
<li>Windows Password (pwl) 文件头：<code>E3 82 85 96</code></li>
</ul>
<h4 id="7、其他类型"><a href="#7、其他类型" class="headerlink" title="7、其他类型"></a><strong>7、其他类型</strong></h4><ul>
<li>windows证书文件(der) 文件头：<code>30 82 03 C9</code></li>
<li>CAD (dwg) 文件头：<code>41 43 31 30</code></li>
<li>Windows Shortcut (lnk) 文件头：<code>4C 00 00 00</code></li>
<li>Windows reg(reg) 文件头：<code>52 45 47 45 44 49 54 34</code></li>
</ul>
