import Logo from "./Logo";

const SECTION_MAP = [
  {
    heading: "Identity",
    color: "#6366f1",
    icon: "⬡",
    fields: [
      { id: "fullName",     label: "Full Name"            },
      { id: "currentTitle", label: "Current Title"        },
      { id: "company",      label: "Company"              },
      { id: "companySize",  label: "Company Size"         },
      { id: "industry",     label: "Industry"             },
      { id: "linkedinUrl",  label: "LinkedIn URL"         },
      { id: "location",     label: "Location"             },
      { id: "email",        label: "Primary Email"        },
      { id: "phone",        label: "WhatsApp / Mobile"    },
      { id: "eaName",       label: "EA Name"              },
      { id: "eaEmail",      label: "EA Email"             },
    ],
  },
  {
    heading: "Career Narrative",
    color: "#8b5cf6",
    icon: "◎",
    fields: [
      { id: "careerSummary",     label: "Career Arc"                 },
      { id: "biggestWin",        label: "Proudest Achievement"       },
      { id: "pivotMoment",       label: "Defining Pivot / Failure"   },
      { id: "unusualBackground", label: "Unusual Background"         },
      { id: "currentFocus",      label: "Current Focus"              },
    ],
  },
  {
    heading: "Brand Goals",
    color: "#C8A96E",
    icon: "◉",
    fields: [
      { id: "primaryGoal",    label: "Primary Goal",      isList: true },
      { id: "dreamOutcome",   label: "Dream Outcome"               },
      { id: "targetAudience", label: "Target Audience"             },
      { id: "keyPeople",      label: "5 Key People to Reach"       },
      { id: "geographicScope",label: "Geographic Scope"            },
      { id: "timeline",       label: "Timeline"                    },
    ],
  },
  {
    heading: "Voice & Tone",
    color: "#5B8FA8",
    icon: "⬡",
    fields: [
      { id: "threeWords",         label: "Three Words"              },
      { id: "communicationStyle", label: "Communication Style", isList: true },
      { id: "neverSoundLike",     label: "Never Sound Like"        },
      { id: "humorLevel",         label: "Humour Level"            },
      { id: "opinionStrength",    label: "Opinion Strength"        },
      { id: "existingContent",    label: "Existing Content Links"  },
      { id: "contentYouAdmire",   label: "Content You Admire"      },
    ],
  },
  {
    heading: "Topics & Expertise",
    color: "#10b981",
    icon: "◎",
    fields: [
      { id: "topicsOwned",    label: "Topics Owned"                },
      { id: "topicsAspire",   label: "Topics to Aspire To"        },
      { id: "strongOpinions", label: "Strong Opinions"            },
      { id: "industryTrends", label: "Overhyped Trends"           },
      { id: "secretWeapon",   label: "Secret Weapon"              },
      { id: "contentTaboos",  label: "Content Taboos"             },
    ],
  },
  {
    heading: "Calendar & Logistics",
    color: "#E8935A",
    icon: "◉",
    fields: [
      { id: "upcomingEvents",      label: "Upcoming Events"              },
      { id: "weeklyTime",          label: "Time Per Week"                },
      { id: "approvalChannel",     label: "Approval Channel"            },
      { id: "approvalTimeframe",   label: "Approval Timeframe"          },
      { id: "postingFrequency",    label: "Posting Frequency"           },
      { id: "contentFormats",      label: "Content Formats", isList: true },
      { id: "ghostwritingComfort", label: "Ghostwriting Comfort"        },
    ],
  },
  {
    heading: "Competitive Landscape",
    color: "#C85A5A",
    icon: "⬡",
    fields: [
      { id: "peerCxOs",       label: "Peer CxOs to Watch"              },
      { id: "differentiator", label: "Differentiator"                  },
      { id: "reputationNow",  label: "Reputation Today"               },
      { id: "brandGaps",      label: "Brand Gaps", isList: true        },
      { id: "associations",   label: "Target Associations"            },
    ],
  },
  {
    heading: "Success Metrics",
    color: "#4A9E7A",
    icon: "◉",
    fields: [
      { id: "successIn30",      label: "Success in 30 Days"     },
      { id: "successIn90",      label: "Success in 90 Days"     },
      { id: "dealbreakers",     label: "Dealbreakers"           },
      { id: "previousAttempts", label: "Previous Attempts"      },
      { id: "budget",           label: "Monthly Budget"         },
      { id: "additionalContext",label: "Additional Context"     },
    ],
  },
];

function FieldValue({ value, isList }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;

  if (isList && Array.isArray(value)) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {value.map((v, i) => (
          <span key={i} style={{
            padding: "4px 12px",
            background: "rgba(99,102,241,0.10)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "100px",
            fontSize: "12px",
            color: "#a5b4fc",
            fontFamily: "'Inter', sans-serif",
          }}>
            {v}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      fontSize: "13px",
      color: "#94A3B8",
      lineHeight: "1.75",
      fontFamily: "'Inter', sans-serif",
      whiteSpace: "pre-wrap",
    }}>
      {String(value)}
    </div>
  );
}

function SectionCard({ section, data }) {
  const filled = section.fields.filter(f => {
    const v = data[f.id];
    return v && (Array.isArray(v) ? v.length > 0 : String(v).trim() !== "");
  });

  if (filled.length === 0) return null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid #1E2A3E",
      borderRadius: "14px",
      overflow: "hidden",
      animation: "ob-field-in 0.4s ease both",
    }}>
      {/* Section header */}
      <div style={{
        padding: "18px 24px",
        borderBottom: "1px solid #1E2A3E",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: `linear-gradient(135deg, ${section.color}0A, transparent)`,
      }}>
        <span style={{ fontSize: "16px", color: section.color }}>{section.icon}</span>
        <span style={{ fontSize: "12px", fontWeight: "600", color: section.color, letterSpacing: "1.5px", fontFamily: "'Inter', sans-serif", textTransform: "uppercase" }}>
          {section.heading}
        </span>
        <span style={{ marginLeft: "auto", fontSize: "10px", color: "#334155", fontFamily: "'Inter', sans-serif" }}>
          {filled.length} / {section.fields.length} fields
        </span>
      </div>

      {/* Fields */}
      <div style={{ padding: "8px 0" }}>
        {filled.map((field, i) => {
          const value = data[field.id];
          return (
            <div key={field.id} style={{
              padding: "14px 24px",
              borderBottom: i < filled.length - 1 ? "1px solid #0D1220" : "none",
            }}>
              <div style={{ fontSize: "10px", color: "#334155", letterSpacing: "1.5px", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", marginBottom: "6px" }}>
                {field.label}
              </div>
              <FieldValue value={value} isList={field.isList} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfileView({ profileData, onStartOnboarding }) {
  const hasData = profileData && Object.keys(profileData).some(k => {
    const v = profileData[k];
    return v && (Array.isArray(v) ? v.length > 0 : String(v).trim() !== "");
  });

  const filledCount = hasData ? Object.values(profileData).filter(v =>
    v && (Array.isArray(v) ? v.length > 0 : String(v).trim() !== "")
  ).length : 0;

  const downloadJSON = () => {
    if (!profileData) return;
    const blob = new Blob([JSON.stringify(profileData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "brand-brief.json"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--ob-bg, #070B14)",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
    }}>
      {/* Ambient blob */}
      <div style={{ position: "fixed", top: "-100px", right: "-100px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "80px 40px 80px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: "40px", animation: "ob-field-in 0.4s ease both" }}>
          <div style={{ fontSize: "11px", color: "#6366f1", letterSpacing: "3px", fontWeight: "600", marginBottom: "12px" }}>
            <Logo size="sm" theme="dark" />
            CLIENT PROFILE
          </div>
          <h1 style={{
            fontSize: "clamp(26px, 4vw, 40px)",
            fontWeight: "700",
            fontFamily: "'Outfit', sans-serif",
            color: "#F1F5F9",
            margin: "0 0 8px",
            letterSpacing: "-0.5px",
          }}>
            {hasData && profileData.fullName ? profileData.fullName : "Your Brand Profile"}
          </h1>
          {hasData && profileData.currentTitle && (
            <p style={{ fontSize: "14px", color: "#64748B", margin: "0 0 20px" }}>
              {profileData.currentTitle}{profileData.company ? ` · ${profileData.company}` : ""}
            </p>
          )}

          {/* Stats row */}
          {hasData && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ padding: "6px 14px", background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "100px", fontSize: "11px", color: "#a5b4fc", fontWeight: "500" }}>
                {filledCount} fields completed
              </div>
              {profileData.industry && (
                <div style={{ padding: "6px 14px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "100px", fontSize: "11px", color: "#6ee7b7" }}>
                  {profileData.industry}
                </div>
              )}
              {profileData.geographicScope && (
                <div style={{ padding: "6px 14px", background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "100px", fontSize: "11px", color: "#C8A96E" }}>
                  {profileData.geographicScope}
                </div>
              )}
              <button
                onClick={downloadJSON}
                style={{ marginLeft: "auto", padding: "6px 16px", background: "transparent", border: "1px solid #1E2A3E", borderRadius: "8px", color: "#64748B", fontSize: "11px", cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
                onMouseEnter={e => { e.target.style.borderColor = "#6366f1"; e.target.style.color = "#a5b4fc"; }}
                onMouseLeave={e => { e.target.style.borderColor = "#1E2A3E"; e.target.style.color = "#64748B"; }}
              >
                ↓ Export JSON
              </button>
            </div>
          )}
        </div>

        {/* Empty state */}
        {!hasData ? (
          <div style={{
            textAlign: "center", padding: "80px 40px",
            background: "rgba(255,255,255,0.02)", border: "1px solid #1E2A3E",
            borderRadius: "16px", animation: "ob-field-in 0.4s ease both",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "20px", opacity: 0.4 }}>⬡</div>
            <h2 style={{ fontSize: "22px", fontWeight: "600", color: "#F1F5F9", fontFamily: "'Outfit', sans-serif", margin: "0 0 10px" }}>
              No profile yet
            </h2>
            <p style={{ fontSize: "14px", color: "#64748B", margin: "0 0 32px", lineHeight: "1.7" }}>
              Complete the onboarding brief to build your brand intelligence profile.
            </p>
            <button
              onClick={onStartOnboarding}
              style={{
                padding: "13px 32px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none", borderRadius: "10px",
                color: "#fff", fontSize: "13px", fontWeight: "600",
                fontFamily: "'Inter', sans-serif", cursor: "pointer",
                boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
              }}
            >
              Start the Brief →
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {SECTION_MAP.map((section, i) => (
              <div key={section.heading} style={{ animationDelay: `${i * 0.05}s` }}>
                <SectionCard section={section} data={profileData} />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
