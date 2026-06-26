"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lightbulb,
  HelpCircle,
  DollarSign,
  Calendar,
  AlertTriangle,
  TrendingUp,
  FileText,
  Scale,
  Percent,
  ArrowLeft,
  Calculator,
  Shield,
  Target,
} from "lucide-react"

// Full guide content for each equity type
const fullGuides = {
  RSU: {
    title: "Restricted Stock Units (RSUs) - Complete Guide",
    sections: [
      {
        title: "What Are RSUs?",
        content: `Restricted Stock Units (RSUs) are a form of equity compensation that represents a promise from your employer to grant you shares of company stock once certain conditions are met. Unlike stock options, RSUs have inherent value even if the stock price doesn't increase above a certain level.

RSUs are "restricted" because they typically come with a vesting schedule - meaning you don't actually own the shares until they vest. Common vesting schedules include:
- 4-year vesting with 1-year cliff (25% vests after 1 year, then monthly/quarterly thereafter)
- 3-year annual vesting (33.33% per year)
- Performance-based vesting tied to company or individual goals`,
      },
      {
        title: "How RSUs Are Taxed",
        content: `RSU taxation occurs at two key events:

**At Vesting (Ordinary Income)**
When RSUs vest, you receive shares of stock. The fair market value (FMV) of those shares on the vesting date is treated as ordinary income - just like your salary. This income is:
- Subject to federal income tax (up to 37%)
- Subject to state income tax (varies by state)
- Subject to Social Security and Medicare taxes (FICA)
- Reported on your W-2

**Example**: If 100 RSUs vest when the stock price is $150/share, you'll recognize $15,000 of ordinary income.

**At Sale (Capital Gains/Losses)**
When you sell the shares, any gain or loss from the vesting price is treated as a capital gain or loss:
- **Short-term capital gains** (held < 1 year): Taxed at ordinary income rates
- **Long-term capital gains** (held > 1 year): Taxed at preferential rates (0%, 15%, or 20%)

**Example**: If you sell those shares at $180/share, you have a $30/share gain ($3,000 total). If held over 1 year, this is taxed at LTCG rates.`,
      },
      {
        title: "Tax Withholding Methods",
        content: `Companies typically use one of three methods to handle tax withholding at vesting:

**1. Sell-to-Cover (Most Common)**
The company sells a portion of your vested shares to cover the tax withholding and delivers the remaining shares to you.
- Pro: No out-of-pocket cash needed
- Con: You receive fewer shares

**2. Net Settlement**
Similar to sell-to-cover, but handled internally. The company withholds shares equivalent to the tax obligation.
- Pro: Simpler process
- Con: Fewer shares delivered

**3. Cash Payment**
You pay the tax withholding amount out-of-pocket and receive all vested shares.
- Pro: You keep all shares
- Con: Requires significant cash on hand

**Important**: Withholding is typically at the supplemental income rate (22% federal), which may be less than your actual tax bracket. Plan to set aside additional funds for tax time.`,
      },
      {
        title: "RSU Planning Strategies",
        content: `**1. Diversification After Vesting**
Consider selling vested RSUs to reduce concentration risk. Many advisors suggest limiting single-stock exposure to 10-20% of your portfolio.

**2. Tax-Loss Harvesting**
If stock price drops below your vesting price, you may have a loss to harvest. This can offset other capital gains.

**3. Holding Period Optimization**
If you believe in the stock, holding vested shares for >1 year converts future gains from ordinary income rates to LTCG rates.

**4. Charitable Giving**
Donating appreciated RSU shares (held >1 year) to charity can avoid capital gains tax while providing a full FMV deduction.

**5. Year-End Planning**
If you have control over the sale timing, consider your expected income for the current vs. next year to optimize your tax bracket.`,
      },
    ],
  },
  ISO: {
    title: "Incentive Stock Options (ISOs) - Complete Guide",
    sections: [
      {
        title: "What Are ISOs?",
        content: `Incentive Stock Options (ISOs) are a type of stock option that can provide favorable tax treatment if specific holding period requirements are met. They are only available to employees (not contractors or board members).

**Key Characteristics:**
- Grant price = Fair market value at grant date
- You choose when to exercise (buy the shares)
- Potential for long-term capital gains treatment
- Subject to $100,000 annual limit (based on grant date FMV)
- Must be exercised within 90 days of leaving employment (or they convert to NSOs)`,
      },
      {
        title: "How ISOs Are Taxed",
        content: `ISOs have unique tax treatment that depends on when you sell the shares:

**At Grant**
No tax event occurs when ISOs are granted.

**At Exercise - Regular Tax**
For regular federal income tax purposes, exercising ISOs does NOT create a taxable event. However, you must pay the exercise price to acquire the shares.

**At Exercise - AMT**
The "bargain element" (FMV minus exercise price) IS a preference item for Alternative Minimum Tax (AMT). This can create a significant AMT liability.

**Example**: You exercise 1,000 ISOs with a $20 strike price when FMV is $50. The $30,000 bargain element is added to your AMT income calculation.

**At Sale - Qualifying Disposition**
If you hold shares for:
- At least 2 years from grant date, AND
- At least 1 year from exercise date

Then the entire gain (from exercise price to sale price) is taxed as long-term capital gains.

**At Sale - Disqualifying Disposition**
If you sell before meeting both holding periods:
- The bargain element at exercise becomes ordinary income
- Any additional gain is capital gain (short or long-term based on holding period from exercise)`,
      },
      {
        title: "AMT and ISO Planning",
        content: `The Alternative Minimum Tax (AMT) is a parallel tax system that can create unexpected tax bills when exercising ISOs.

**How AMT Works with ISOs:**
1. Calculate your regular tax
2. Add back AMT preference items (including ISO bargain element)
3. Calculate AMT
4. Pay the higher of regular tax or AMT

**AMT Planning Strategies:**

**1. Spread Exercises Over Multiple Years**
Instead of exercising all ISOs in one year, spread exercises to stay below AMT thresholds.

**2. Exercise Early in the Year**
If stock price drops, you can sell before year-end to avoid AMT on paper gains you no longer have.

**3. Same-Day Sale**
Exercise and immediately sell to avoid AMT (but you'll have ordinary income instead of potential LTCG).

**4. AMT Credit Carryforward**
AMT paid on ISO exercises may generate AMT credits that can reduce future regular tax liability. Track these carefully.

**5. Model Different Scenarios**
Work with a tax advisor to model the impact of different exercise quantities and timing.`,
      },
      {
        title: "ISO Exercise Strategies",
        content: `**1. Exercise and Hold (Qualifying Disposition)**
Best when: You're bullish on the stock and can meet holding periods
Risk: Stock price may decline; AMT exposure
Reward: All gains taxed at LTCG rates

**2. Exercise and Sell (Disqualifying Disposition)**
Best when: You want to lock in gains or need liquidity
Risk: Higher ordinary income tax on bargain element
Reward: No AMT risk; immediate diversification

**3. Exercise and Sell Some (Partial)**
Best when: You want some LTCG potential but also liquidity
Approach: Sell enough to cover exercise cost and taxes, hold the rest

**4. 83(b) Election Considerations**
Not applicable to ISOs, but if your company offers early exercise, this changes the calculus.

**5. Approaching Expiration**
ISOs typically expire 10 years from grant. Don't let valuable options expire worthless. Create a calendar reminder 1-2 years before expiration.`,
      },
    ],
  },
  NSO: {
    title: "Non-Qualified Stock Options (NSOs) - Complete Guide",
    sections: [
      {
        title: "What Are NSOs?",
        content: `Non-Qualified Stock Options (NSOs or NQSOs) are stock options that don't qualify for the special tax treatment of ISOs. They are more flexible and can be granted to employees, contractors, board members, and advisors.

**Key Characteristics:**
- Grant price typically equals FMV at grant date
- No $100,000 annual limit
- Can be granted to non-employees
- Simpler tax treatment (no AMT concerns)
- Often have longer post-termination exercise periods than ISOs`,
      },
      {
        title: "How NSOs Are Taxed",
        content: `NSO taxation is more straightforward than ISOs:

**At Grant**
No tax event occurs when NSOs are granted (assuming granted at FMV).

**At Exercise (Ordinary Income)**
When you exercise NSOs, the "spread" or "bargain element" (FMV minus exercise price) is taxed as ordinary income. This is:
- Subject to federal income tax
- Subject to state income tax
- Subject to FICA taxes (Social Security & Medicare)
- Reported on your W-2 or 1099

**Example**: You exercise 1,000 NSOs with a $20 strike price when FMV is $60. The $40,000 spread is ordinary income.

**At Sale (Capital Gains/Losses)**
After exercise, you own shares with a cost basis equal to FMV at exercise. Any subsequent gain or loss is capital:
- Short-term if held < 1 year from exercise
- Long-term if held > 1 year from exercise

**Example**: You later sell those shares at $80. The $20/share gain is capital gain.`,
      },
      {
        title: "NSO vs. ISO Comparison",
        content: `| Feature | NSO | ISO |
|---------|-----|-----|
| Who can receive | Anyone | Employees only |
| Tax at exercise | Ordinary income | No regular tax (AMT possible) |
| LTCG potential | After exercise | On total gain if qualified |
| Annual limit | None | $100,000 |
| Post-termination exercise | Often longer | 90 days (or converts to NSO) |
| Employer deduction | Yes, at exercise | No |

**When NSOs May Be Preferable:**
- You're not an employee (contractor, advisor)
- You want to avoid AMT complexity
- You plan to exercise and sell immediately
- Company needs the tax deduction

**When ISOs May Be Preferable:**
- You're an employee and plan to hold long-term
- You can manage AMT exposure
- You're in a high tax bracket and want LTCG treatment`,
      },
      {
        title: "NSO Planning Strategies",
        content: `**1. Timing of Exercise**
Unlike ISOs, there's no AMT consideration. Consider exercising when:
- You're in a lower tax bracket (between jobs, sabbatical)
- You have losses to offset the income
- You're confident in the stock's future

**2. Cashless Exercise**
Many companies offer "cashless" or "same-day sale" exercises:
- Broker advances funds to exercise
- Shares are immediately sold
- You receive net proceeds after taxes
- No out-of-pocket cash required

**3. Exercise and Hold**
If you're bullish on the stock:
- Exercise and hold shares
- Pay tax on the spread now
- Future appreciation taxed at (hopefully) LTCG rates

**4. Staged Exercises**
Spread exercises over multiple years to:
- Manage tax bracket creep
- Reduce single-year income spikes
- Maintain flexibility

**5. Charitable Planning**
After exercise, if you hold shares long enough for LTCG treatment:
- Donate appreciated shares to charity
- Avoid capital gains tax
- Receive FMV deduction`,
      },
    ],
  },
  ESPP: {
    title: "Employee Stock Purchase Plans (ESPPs) - Complete Guide",
    sections: [
      {
        title: "What Is an ESPP?",
        content: `An Employee Stock Purchase Plan (ESPP) allows employees to purchase company stock at a discount, typically through payroll deductions. Most ESPPs are "qualified" under Section 423 of the tax code, which provides favorable tax treatment.

**Key Features of Qualified ESPPs:**
- Maximum discount of 15% from market price
- "Lookback" provision may use lower of start or end price
- Maximum contribution of $25,000 per year (based on FMV at offering date)
- Holding period requirements for favorable tax treatment
- All eligible employees must be allowed to participate`,
      },
      {
        title: "How ESPPs Work",
        content: `**Offering Period Structure**
- **Offering Period**: 6-24 months during which you accumulate contributions
- **Purchase Period**: End of offering period when shares are purchased
- **Lookback**: Many plans use the lower of the stock price at offering start or purchase date

**Example with Lookback:**
- Offering starts: Stock at $100
- Offering ends: Stock at $150
- Your price: 85% of $100 = $85/share (29% effective discount!)

**Contribution Limits:**
- Typically 1-15% of salary via payroll deduction
- $25,000 annual limit based on FMV at offering date
- Contributions accumulate in an account until purchase date`,
      },
      {
        title: "How ESPPs Are Taxed",
        content: `ESPP taxation depends on whether you make a "qualifying" or "disqualifying" disposition:

**Qualifying Disposition**
Hold shares for BOTH:
- 2 years from offering date, AND
- 1 year from purchase date

Tax treatment:
- **Ordinary income**: Lesser of (1) actual gain or (2) the discount at offering date
- **LTCG**: Any remaining gain

**Disqualifying Disposition**
Sell before meeting both holding periods.

Tax treatment:
- **Ordinary income**: Full discount at purchase (FMV at purchase minus your price)
- **Capital gain/loss**: Any additional gain or loss from purchase price FMV

**Example:**
- Offering date FMV: $100
- Purchase date FMV: $120
- Your price: $85 (15% off $100 lookback)
- Sale price: $140

**Qualifying disposition:**
- Ordinary income: $15 (15% discount on $100)
- LTCG: $40 ($140 - $100)

**Disqualifying disposition:**
- Ordinary income: $35 ($120 - $85)
- Capital gain: $20 ($140 - $120)`,
      },
      {
        title: "ESPP Strategies",
        content: `**1. Always Participate (If Cash Flow Allows)**
A 15% discount is essentially a guaranteed return. Even with transaction costs and taxes, this is typically a great deal.

**2. Immediate Sale Strategy**
Some employees prefer to:
- Sell immediately at purchase
- Pay tax on the discount as ordinary income
- Capture the guaranteed discount without stock risk
- Reinvest proceeds in a diversified portfolio

**3. Qualifying Disposition Strategy**
If you're bullish on the stock:
- Hold for both holding periods
- Potentially reduce ordinary income portion
- Risk: Stock price could decline

**4. Tax-Lot Tracking**
ESPP purchases often occur multiple times per year. Track each lot separately for:
- Holding period calculations
- Cost basis determination
- Tax-loss harvesting opportunities

**5. Maximize the Lookback**
In plans with lookback:
- A rising stock during offering period increases your effective discount
- Consider this when evaluating your overall equity exposure`,
      },
    ],
  },
}

// FAQ content
const faqCategories = [
  {
    category: "Tax Basics",
    icon: DollarSign,
    questions: [
      {
        question: "What's the difference between ordinary income and capital gains?",
        answer: `**Ordinary Income** is taxed at your marginal tax rate (10% to 37% federal, plus state taxes). This includes your salary, bonuses, RSU vesting income, NSO exercise spread, and short-term capital gains.

**Capital Gains** come from selling assets held for investment:
- **Short-term** (held < 1 year): Taxed as ordinary income
- **Long-term** (held > 1 year): Taxed at preferential rates of 0%, 15%, or 20% depending on your income level

**Example**: If you're in the 35% tax bracket, $10,000 of ordinary income costs you $3,500 in federal tax. The same $10,000 as long-term capital gains might only cost $1,500 (15% rate).`,
      },
      {
        question: "When do I owe taxes on my equity compensation?",
        answer: `The timing depends on the type of equity:

**RSUs**: Tax due at vesting (when shares are delivered)
- Withholding happens automatically
- Reported on W-2 for the year of vesting

**Stock Options (ISO/NSO)**: Tax depends on exercise and sale
- NSOs: Ordinary income at exercise
- ISOs: No regular tax at exercise (but AMT may apply)
- Both: Capital gains/losses at sale

**ESPP**: Tax depends on sale timing
- Income recognized when shares are sold
- Holding period determines ordinary vs. capital treatment`,
      },
      {
        question: "What is AMT and how does it affect my equity compensation?",
        answer: `The Alternative Minimum Tax (AMT) is a parallel tax system designed to ensure high-income taxpayers pay a minimum amount of tax. It removes certain deductions and adds back "preference items."

**ISO Exercise and AMT:**
When you exercise ISOs and hold the shares, the "bargain element" (FMV minus strike price) is an AMT preference item. This doesn't affect regular tax, but can trigger AMT.

**Managing AMT:**
- Spread ISO exercises across multiple years
- Model your AMT exposure before exercising
- Consider exercising early in the year (gives time to assess and potentially sell)
- Track AMT credits from prior years for potential recovery`,
      },
      {
        question: "How do state taxes affect my equity compensation?",
        answer: `State tax treatment varies significantly:

**No State Income Tax**: TX, FL, WA, NV, WY, SD, AK, NH (limited), TN (limited)

**High State Tax**: CA (up to 13.3%), NY (up to 10.9%), NJ (up to 10.75%)

**Special Considerations:**
- Some states don't recognize federal LTCG rates
- State residency rules can be complex (especially if you moved)
- Some states tax equity based on where work was performed, not current residence
- California is particularly aggressive about "sourcing" income

**Planning Tip**: If you're considering relocating, understand the equity tax implications before moving.`,
      },
    ],
  },
  {
    category: "Vesting & Exercise",
    icon: Calendar,
    questions: [
      {
        question: "What happens to my equity if I leave the company?",
        answer: `**RSUs (Unvested)**: Typically forfeited. Some companies have acceleration provisions for retirement, death, or acquisition scenarios.

**RSUs (Vested)**: You own the shares. Nothing changes.

**Stock Options**: Critical to understand your post-termination exercise period:
- ISOs: Usually 90 days to exercise or they convert to NSOs
- NSOs: Varies by plan (30 days to several years)
- Unvested options are typically forfeited

**ESPP**: 
- Contributions returned (without interest)
- Any shares already purchased are yours to keep

**Action Items Before Leaving:**
1. Review all equity agreements
2. Note post-termination exercise deadlines
3. Model the tax impact of exercising
4. Consider early exercise if permitted and beneficial`,
      },
      {
        question: "Should I exercise my stock options early?",
        answer: `Early exercise depends on several factors:

**Potential Benefits:**
- Start the capital gains holding period earlier
- For ISOs: Start the 2-year holding period from grant
- Potentially lower AMT impact (if stock appreciates significantly)
- 83(b) election may lock in low taxable value

**Potential Risks:**
- You're paying for something that might be worthless
- If you leave, you might forfeit unvested shares
- Cash flow impact
- Stock price might decline

**When Early Exercise Makes Sense:**
- You have high conviction in the company
- The current spread is low (minimizing tax/AMT)
- You can afford to lose the exercise cost
- You're an early-stage employee with significant upside

**When to Wait:**
- You're uncertain about the company's future
- The spread is already large (significant tax impact)
- You need the cash for other purposes`,
      },
      {
        question: "What is a 'cashless exercise' and should I use it?",
        answer: `A cashless exercise (or same-day sale) lets you exercise stock options without using your own cash:

**How It Works:**
1. Your broker advances funds to cover the exercise price
2. Shares are immediately sold
3. Proceeds cover the exercise price + taxes + fees
4. You receive the remaining cash

**Advantages:**
- No out-of-pocket cash required
- Immediate diversification
- Lock in the current gain
- Simpler than managing share ownership

**Disadvantages:**
- No potential for long-term capital gains
- NSOs: All gain is ordinary income
- ISOs: Automatically becomes a disqualifying disposition
- You miss out if stock price increases

**Best For:**
- Those needing liquidity
- Risk-averse individuals
- When you want to diversify immediately
- Near expiration with significant spread`,
      },
    ],
  },
  {
    category: "Planning & Strategy",
    icon: Target,
    questions: [
      {
        question: "How much company stock is too much?",
        answer: `**General Guidelines:**
- Most financial advisors suggest no single stock should exceed 10-20% of your portfolio
- For executives with concentrated positions, even 10% may be considered high
- Consider your total exposure: vested shares + unvested equity + future grants

**Concentration Risk Factors:**
- Your income already depends on the company
- Stock price volatility
- Industry/sector concentration
- Your time horizon and financial goals

**Diversification Strategies:**
- Set a target maximum concentration percentage
- Implement systematic selling (e.g., sell 25% of each vest)
- Use limit orders to capture target prices
- Consider covered calls for income while holding
- 10b5-1 plans for insiders subject to trading windows`,
      },
      {
        question: "What is a 10b5-1 plan and do I need one?",
        answer: `A 10b5-1 plan is a pre-arranged trading plan that allows insiders to sell company stock on a predetermined schedule, even during blackout periods.

**Who Needs One:**
- Executives and directors
- Anyone subject to trading windows/blackouts
- Those with material non-public information

**How It Works:**
1. Establish the plan when you don't have inside information
2. Specify the number of shares, price, and timing
3. Trades execute automatically per the plan
4. Provides an "affirmative defense" against insider trading claims

**Best Practices:**
- Wait 90+ days between plan adoption and first trade (new SEC rules)
- Don't modify the plan frequently
- Work with legal counsel to ensure compliance
- Coordinate with tax and financial advisors

**Benefits:**
- Trade during blackout periods
- Systematic diversification
- Reduced decision fatigue
- Legal protection`,
      },
      {
        question: "How should I coordinate equity compensation with my overall financial plan?",
        answer: `**Integration Checklist:**

**1. Cash Flow Planning**
- Anticipate tax withholding shortfalls
- Plan for exercise costs
- Budget for estimated tax payments

**2. Investment Allocation**
- Include company stock in your asset allocation
- Rebalance after vesting events
- Consider sector concentration

**3. Tax Planning**
- Coordinate with other income sources
- Time exercises and sales strategically
- Harvest losses when available
- Maximize retirement contributions

**4. Risk Management**
- Maintain emergency fund (don't rely on unvested equity)
- Diversify systematically
- Consider hedging strategies for large positions

**5. Estate Planning**
- Update beneficiary designations
- Consider gifting strategies for appreciated shares
- Understand estate tax implications

**6. Goal Alignment**
- Match equity compensation with specific goals
- Create a "waterfall" plan for proceeds
- Document your strategy`,
      },
      {
        question: "What are the key dates I should track for my equity?",
        answer: `**Critical Dates to Calendar:**

**For All Equity:**
- Vesting dates
- Company blackout periods
- Tax payment deadlines (quarterly estimates if needed)

**For Stock Options:**
- Grant date
- Vesting schedule
- Expiration date (typically 10 years from grant)
- 90-day post-termination exercise deadline (ISOs)

**For ISOs Specifically:**
- 2-year anniversary from grant (for qualifying disposition)
- 1-year anniversary from exercise (for qualifying disposition)
- AMT credit recovery tracking

**For ESPPs:**
- Offering period start and end dates
- Purchase dates
- 2-year from offering / 1-year from purchase (for qualifying disposition)

**Proactive Planning:**
- Set reminders 3-6 months before expiration
- Review holdings at each vesting event
- Annual review of overall equity strategy`,
      },
    ],
  },
  {
    category: "Special Situations",
    icon: AlertTriangle,
    questions: [
      {
        question: "What happens to my equity in a company acquisition?",
        answer: `Acquisition treatment depends on deal structure and your equity agreements:

**Common Scenarios:**

**Cash Acquisition:**
- Unvested RSUs/options may be accelerated or cancelled
- Vested options typically cashed out at deal price minus strike
- Creates taxable event at closing

**Stock-for-Stock Merger:**
- Your equity may convert to acquirer's equity
- Often maintains vesting schedules
- May get "double trigger" acceleration (acquisition + termination)

**Mixed Consideration:**
- Combination of cash and stock
- Complex tax implications

**What to Check:**
- Your grant agreements (look for "change in control" provisions)
- Single vs. double trigger acceleration
- Treatment of unvested vs. vested equity
- Whether deal allows net exercise

**Action Items:**
- Review all equity documents immediately
- Consult tax advisor before deal closes
- Understand your choices and deadlines
- Model tax scenarios`,
      },
      {
        question: "How do I handle equity compensation in a divorce?",
        answer: `Equity compensation adds complexity to divorce proceedings:

**Key Considerations:**

**Characterization:**
- Community property vs. separate property
- When was the equity granted vs. when does it vest?
- "Time rule" formulas for allocating vested/unvested portions

**Valuation:**
- Public company: Use market price
- Private company: May need independent valuation
- Options: Intrinsic value vs. Black-Scholes

**Division Methods:**
- Immediate offset (trade equity for other assets)
- Deferred distribution (split when equity vests/sells)
- Trustee arrangement

**Tax Issues:**
- Who pays tax on future income?
- Transferring RSUs vs. shares
- Timing of sales

**Best Practices:**
- Engage a divorce attorney experienced with equity compensation
- Get accurate valuations
- Model tax scenarios for both parties
- Document all equity holdings clearly`,
      },
      {
        question: "What are the implications of a company going public (IPO)?",
        answer: `An IPO creates both opportunities and restrictions:

**Before IPO:**
- Exercise options while stock is valued lower
- 83(b) election considerations for early exercises
- May not know exact IPO price or timing

**At IPO:**
- Lockup period begins (typically 90-180 days)
- Cannot sell during lockup
- Stock becomes liquid (eventually)

**Lockup Period Considerations:**
- Price may be volatile after lockup expires
- Many insiders selling simultaneously can pressure price
- Consider 10b5-1 plan established before lockup ends

**After Lockup:**
- Ongoing blackout windows apply
- Section 16 reporting for certain insiders
- Consider systematic diversification plan

**Tax Planning:**
- Model scenarios at different IPO prices
- Plan for potential AMT exposure (ISO exercises)
- Quarterly estimated tax payments may be needed
- State tax implications if you've moved`,
      },
    ],
  },
]

// Quick reference cards
const quickReferenceCards = [
  {
    title: "Tax Rate Quick Reference",
    icon: Percent,
    items: [
      { label: "Federal Ordinary Income (Top)", value: "37%" },
      { label: "Federal LTCG (Top)", value: "20%" },
      { label: "Net Investment Income Tax", value: "3.8%" },
      { label: "Social Security (up to limit)", value: "6.2%" },
      { label: "Medicare (no limit)", value: "1.45% - 2.35%" },
    ],
  },
  {
    title: "Key Holding Periods",
    icon: Clock,
    items: [
      { label: "LTCG Qualification", value: "> 1 year" },
      { label: "ISO Qualifying Disposition", value: "2yr grant + 1yr exercise" },
      { label: "ESPP Qualifying Disposition", value: "2yr offering + 1yr purchase" },
      { label: "ISO Post-Termination", value: "90 days" },
    ],
  },
  {
    title: "Annual Limits",
    icon: Calculator,
    items: [
      { label: "ISO Vesting Limit", value: "$100,000/year" },
      { label: "ESPP Contribution Limit", value: "$25,000/year" },
      { label: "Gift Tax Exclusion", value: "$18,000/person" },
      { label: "Estate Tax Exemption", value: "$13.61M" },
    ],
  },
]

interface EquityTypeInfo {
  type: "RSU" | "ISO" | "NSO" | "ESPP"
  title: string
  description: string
  keyPoints: string[]
  badge: {
    text: string
    variant: "success" | "warning"
  }
  progress: number
}

const equityTypes: EquityTypeInfo[] = [
  {
    type: "RSU",
    title: "Restricted Stock Units",
    description:
      "RSUs generally create ordinary income when shares vest. The post-vesting holding period determines capital-gains treatment on future appreciation or losses.",
    keyPoints: [
      "No purchase required",
      "Taxed at vest as ordinary income",
      "Post-vest gains may qualify for LTCG",
    ],
    badge: { text: "No exercise cost", variant: "success" },
    progress: 100,
  },
  {
    type: "ISO",
    title: "Incentive Stock Options",
    description:
      "ISOs can receive favorable long-term capital-gains treatment if holding-period rules are met, but the bargain element may create AMT exposure.",
    keyPoints: [
      "Potential for LTCG treatment",
      "AMT preference item at exercise",
      "Must hold 2 years from grant, 1 year from exercise",
    ],
    badge: { text: "AMT-sensitive", variant: "warning" },
    progress: 75,
  },
  {
    type: "NSO",
    title: "Non-Qualified Stock Options",
    description:
      "NSOs generally trigger ordinary income on the spread at exercise. Future appreciation after exercise may qualify for capital-gains treatment.",
    keyPoints: [
      "Ordinary income at exercise",
      "No AMT concerns",
      "Flexible exercise timing",
    ],
    badge: { text: "Flexible planning", variant: "success" },
    progress: 60,
  },
  {
    type: "ESPP",
    title: "Employee Stock Purchase Plans",
    description:
      "Qualified ESPPs may offer a discount and special tax rules. Holding periods and plan design determine how the discount and gain are taxed.",
    keyPoints: [
      "Typically 15% discount",
      "Lookback provisions common",
      "Qualifying disposition rules apply",
    ],
    badge: { text: "Watch sale timing", variant: "warning" },
    progress: 45,
  },
]

export function EducationCenter() {
  const [selectedGuide, setSelectedGuide] = useState<keyof typeof fullGuides | null>(null)
  const [activeSection, setActiveSection] = useState(0)

  const currentGuide = selectedGuide ? fullGuides[selectedGuide] : null

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Equity Compensation Education Center
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Comprehensive guides, FAQs, and planning resources for executive compensation.
            </p>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">
            <BookOpen className="mr-1 h-3 w-3" />
            4 Complete Guides
          </Badge>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="guides" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="guides" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Guides</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">FAQs</span>
          </TabsTrigger>
          <TabsTrigger value="reference" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Reference</span>
          </TabsTrigger>
          <TabsTrigger value="checklist" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Checklists</span>
          </TabsTrigger>
        </TabsList>

        {/* Guides Tab */}
        <TabsContent value="guides" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {equityTypes.map((equity) => (
              <Card
                key={equity.type}
                className="overflow-hidden transition-all hover:shadow-lg"
              >
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-serif text-sm font-bold text-primary">
                        {equity.type}
                      </div>
                      <div>
                        <CardTitle className="font-serif text-lg">
                          {equity.title}
                        </CardTitle>
                        <div className="mt-1 flex items-center gap-2">
                          <Progress value={equity.progress} className="h-1.5 w-20" />
                          <span className="text-xs text-muted-foreground">
                            {equity.progress}% complete
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0",
                        equity.badge.variant === "success" &&
                          "border-emerald-200 bg-emerald-50 text-emerald-700",
                        equity.badge.variant === "warning" &&
                          "border-amber-200 bg-amber-50 text-amber-700"
                      )}
                    >
                      {equity.badge.text}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {equity.description}
                  </p>

                  <div className="mt-4 space-y-2">
                    {equity.keyPoints.map((point, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 -ml-2 gap-1"
                    onClick={() => {
                      setSelectedGuide(equity.type)
                      setActiveSection(0)
                    }}
                  >
                    <BookOpen className="h-4 w-4" />
                    Read full guide
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          {faqCategories.map((category) => (
            <Card key={category.category}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <category.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="font-serif text-xl">{category.category}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, index) => (
                    <AccordionItem key={index} value={`${category.category}-${index}`}>
                      <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="prose prose-sm max-w-none text-muted-foreground">
                          {faq.answer.split("\n\n").map((paragraph, i) => (
                            <p key={i} className="mb-3 whitespace-pre-wrap text-sm leading-relaxed">
                              {paragraph.split("**").map((part, j) =>
                                j % 2 === 1 ? (
                                  <strong key={j} className="text-foreground">{part}</strong>
                                ) : (
                                  part
                                )
                              )}
                            </p>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Reference Tab */}
        <TabsContent value="reference" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {quickReferenceCards.map((card) => (
              <Card key={card.title}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <card.icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base">{card.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {card.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="font-mono text-sm font-semibold">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tax Treatment Comparison Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Scale className="h-5 w-5" />
                </div>
                <CardTitle className="font-serif text-xl">Tax Treatment Comparison</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 text-left font-medium">Event</th>
                      <th className="pb-3 text-left font-medium">RSU</th>
                      <th className="pb-3 text-left font-medium">ISO</th>
                      <th className="pb-3 text-left font-medium">NSO</th>
                      <th className="pb-3 text-left font-medium">ESPP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-3 font-medium">At Grant</td>
                      <td className="py-3 text-muted-foreground">No tax</td>
                      <td className="py-3 text-muted-foreground">No tax</td>
                      <td className="py-3 text-muted-foreground">No tax</td>
                      <td className="py-3 text-muted-foreground">No tax</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium">At Vest/Exercise</td>
                      <td className="py-3">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700">Ordinary Income</Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">AMT Possible</Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700">Ordinary Income</Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">N/A</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium">At Sale (Qualifying)</td>
                      <td className="py-3">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">LTCG on gain</Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">LTCG on full gain</Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">LTCG on gain</Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700">Partial LTCG</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium">At Sale (Disqualifying)</td>
                      <td className="py-3 text-muted-foreground">N/A</td>
                      <td className="py-3">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700">Ordinary + CG</Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">N/A</td>
                      <td className="py-3">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700">Ordinary + CG</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checklists Tab */}
        <TabsContent value="checklist" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <CardTitle className="font-serif">Annual Equity Review Checklist</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Review all outstanding grants and vesting schedules",
                  "Calculate total company stock exposure as % of net worth",
                  "Identify options approaching expiration (within 2 years)",
                  "Model tax impact of planned exercises/sales",
                  "Update diversification strategy if concentration > 20%",
                  "Review and update beneficiary designations",
                  "Check for upcoming blackout periods",
                  "Confirm 10b5-1 plan status (if applicable)",
                  "Review AMT credit carryforward balance",
                  "Coordinate with CPA on estimated tax payments",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border">
                      <span className="text-xs text-muted-foreground">{i + 1}</span>
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <CardTitle className="font-serif">Pre-Exercise Decision Checklist</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Confirm option type (ISO vs NSO) and terms",
                  "Calculate exercise cost and current spread",
                  "Model regular tax impact",
                  "Model AMT impact (ISOs only)",
                  "Verify funds available for exercise cost",
                  "Set aside funds for tax withholding/payments",
                  "Check if you're in a trading window",
                  "Consider holding period requirements",
                  "Evaluate current vs. expected future tax rates",
                  "Document rationale for the decision",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border">
                      <span className="text-xs text-muted-foreground">{i + 1}</span>
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <CardTitle className="font-serif">Job Change Equity Checklist</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "List all unvested equity (will be forfeited)",
                  "Identify post-termination exercise deadlines",
                  "Calculate cost to exercise all vested options",
                  "Model tax impact of exercising before leaving",
                  "Check for accelerated vesting provisions",
                  "Understand COBRA impact on ESPP eligibility",
                  "Request final equity statement from employer",
                  "Transfer shares to personal brokerage account",
                  "Update financial plan for lost unvested equity",
                  "Negotiate equity package with new employer",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border">
                      <span className="text-xs text-muted-foreground">{i + 1}</span>
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-2 text-purple-700">
                    <Shield className="h-5 w-5" />
                  </div>
                  <CardTitle className="font-serif">Tax Season Preparation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Gather all 1099-B forms for stock sales",
                  "Obtain Form 3921 (ISO exercises)",
                  "Obtain Form 3922 (ESPP transfers)",
                  "Compile cost basis documentation",
                  "Calculate wash sale adjustments if applicable",
                  "Review W-2 for equity income inclusion",
                  "Calculate AMT exposure and credits",
                  "Document qualifying vs. disqualifying dispositions",
                  "Prepare estimated tax calculations for next year",
                  "Schedule meeting with tax advisor",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border">
                      <span className="text-xs text-muted-foreground">{i + 1}</span>
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Roadmap Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2 text-accent">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Completed Feature Roadmap
              </p>
              <CardTitle className="font-serif text-xl">
                Dashboard Enhancements
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Client profiles & state presets",
              "Grant editing in table",
              "10b5-1 planning notes",
              "Concentration risk thresholds",
              "Household liquidity targets",
              "AMT credit tracking",
              "Printable client summary",
              "Multi-year projections",
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border bg-emerald-50/50 px-3 py-2 text-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {feature}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Full Guide Dialog */}
      <Dialog open={selectedGuide !== null} onOpenChange={(open) => !open && setSelectedGuide(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedGuide(null)}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle className="font-serif text-xl">
                  {currentGuide?.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  {currentGuide?.sections.length} sections
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Section Navigation */}
            <div className="w-64 border-r bg-muted/30 p-4 shrink-0 hidden md:block">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Sections
              </p>
              <nav className="space-y-1">
                {currentGuide?.sections.map((section, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSection(i)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      activeSection === i
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1 p-6">
              {currentGuide?.sections.map((section, i) => (
                <div
                  key={i}
                  className={cn("space-y-4", activeSection !== i && "hidden md:hidden")}
                >
                  <h3 className="font-serif text-2xl font-semibold">{section.title}</h3>
                  <div className="prose prose-sm max-w-none">
                    {section.content.split("\n\n").map((paragraph, j) => (
                      <p key={j} className="mb-4 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {paragraph.split("**").map((part, k) =>
                          k % 2 === 1 ? (
                            <strong key={k} className="text-foreground">{part}</strong>
                          ) : (
                            part
                          )
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              ))}

              {/* Mobile Section Navigation */}
              <div className="flex gap-2 mt-8 md:hidden">
                <Button
                  variant="outline"
                  disabled={activeSection === 0}
                  onClick={() => setActiveSection(activeSection - 1)}
                  className="flex-1"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={activeSection === (currentGuide?.sections.length || 1) - 1}
                  onClick={() => setActiveSection(activeSection + 1)}
                  className="flex-1"
                >
                  Next
                </Button>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
