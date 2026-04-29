---
title: "doublefree"
date: 2023-06-04 15:14:29
updated: 2023-06-04 15:14:29
categories:
  - "heap"
tags:
  - "fastbin attack"
abbrlink: "double free"
---

<h3 id="利用条件"><a href="#利用条件" class="headerlink" title="利用条件"></a>利用条件</h3><blockquote>
<p>1.fastbin 的堆块被释放后 next_chunk 的 pre_inuse 位不会被清空<br>2.fastbin 在执行 free 的时候仅验证了 main_arena 直接指向的块，即链表指针头部的块。对于链表后面的块，并没有进行验证。</p>
</blockquote>
<p>该漏洞是指将同一个chunk free两次，通常情况下free两个chunk会报错是无法编译的，监测机制也很简单，就仅仅是对free变量与前一个进行对比，所以可以中间夹一个其他的实现：</p>
<figure class="highlight stylus"><table><tbody><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br></pre></td><td class="code"><pre><code class="hljs stylus"><span class="hljs-function"><span class="hljs-title">free</span><span class="hljs-params">(shangu1)</span></span><br><span class="hljs-function"><span class="hljs-title">free</span><span class="hljs-params">(shangu2)</span></span><br><span class="hljs-function"><span class="hljs-title">free</span><span class="hljs-params">(shangu1)</span></span><br></code></pre></td></tr></tbody></table></figure>

<p>此时的 bins 中情况大概如下：0x20 —&gt; shangu1 —&gt; shangu2 —&gt; shangu1<br>当再次申请堆时会出现 有两个指针指向同一个chunk</p>
<p>![联想截图_20230322221849.png](<a target="_blank" rel="noopener" href="https://s2.loli.net/2023/09/12/BI6lRtbdPnKTuMN.png">https://s2.loli.net/2023/09/12/BI6lRtbdPnKTuMN.png</a></p>
