//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    tabs:[
      { title: '工资、薪金所得' },
      { title: '年终奖' },
      { title: '其他' },
    ],
    currentTab:0,
    radio_items: [
      { name: '3500', value: '国内：3500', checked: 'true'},
      { name: '4800', value: '外籍：4800' }
    ],
    incomeType: ['劳务报酬所得', '个体工商户生产、经营所得', '对企事业单位的承包、承租经营所得', '稿酬所得', '特许权使用费所得', '财产租赁所得', '财产转让所得', '利息、股息、红利所得','偶然所得'],
    
    incomeTypeIndex:0,
    tax: { price1: 0, price2: 0, price3: 0, price4: 0, price5: 0 },
    isHidden:true,
    is_after:false
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
   
  },

  swichNav (e) {
    const index = e.target.dataset.current
    this.setData({currentTab:index})
  },
  radioChange(e) {
    console.log('radio发生change事件，携带value值为：', e.detail.value)
  },
  bindPickerChange (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      incomeTypeIndex: e.detail.value
    })
  },
  formSubmit: function (e) {
    const value = e.detail.value
    console.log('form发生了submit事件，携带数据为：', e.detail.value)
      // validateFields((error, value) => {
      //   if (!!error) {
      //     Toast.info('请填写完整');
      //     return
      //   }
        let total = 0;
        const { currentTab } = this.data;
        console.log(currentTab)

        const { salary, state, security, yearEnd, isDomestic } = value;
        this.setData({ is_after: state})
        let amount = 0;
        let tax = 0, rate_k = 0, rate_item = 0;

        const rates = [
          { 1500: [0, 0.03] },
          { 4500: [105, 0.1] },
          { 9000: [555, 0.2] },
          { 35000: [1005, 0.25] },
          { 55000: [2755, 0.3] },
          { 80000: [5505, 0.35] },
          { 80001: [13505, 0.45] }
        ];
        switch (currentTab) {
          case 0:
            
            amount = salary - security - isDomestic;
            if (state) {   //税前工资计算税后
              const { taxes, k, item } = this.calculate(amount, rates);
              tax = taxes;
              rate_k = k;
              rate_item = item;
              total = salary - security - taxes;
            }
            else {
              amount = salary - isDomestic;
              const ratesAfter = [
                { 1455: [0, 0.03] },
                { 4155: [105, 0.1] },
                { 7755: [555, 0.2] },
                { 27255: [1005, 0.25] },
                { 41255: [2755, 0.3] },
                { 57505: [5505, 0.35] },
                { 57506: [13505, 0.45] }
              ];
              const k_after = this.calculate(amount, ratesAfter).k,
                item_after = this.calculate(amount, ratesAfter).item;
              amount = (amount - item_after) / (1 - k_after);
              let { taxes, k, item } = this.calculate(amount, rates);
              tax = taxes;
              rate_k = k;
              rate_item = item;
              total = parseFloat(salary) + parseFloat(security) + parseFloat(tax);
            }
            break;
          case 1:
            amount = yearEnd;
            const { taxes, k, item } = this.calculate(amount, rates, amount / 12);
            tax = taxes;
            rate_k = k;
            rate_item = item;
            total = amount - tax;

            break;
          case 2:
            const incomeType = this.data.incomeTypeIndex
            const { income } = value;
            const gtgs_rate = [{ 15000: [0, 0.05] }, { 30000: [750, 0.1] }, { 60000: [3750, 0.2] }, { 100000: [9750, 0.3] }, { 100001: [14750, 0.35] }];//个体工商
            switch (incomeType) {
              case 0:
                const lw_rate = [{ 20000: [0, 0.2] }, { 50000: [2000, 0.3] }, { 50001: [7000, 0.4] }];//劳务
                amount = income > 4000 ? income * 0.8 : income - 800;
                const { taxes, k, item } = this.calculate(amount, lw_rate);
                tax = taxes;
                rate_k = k;
                rate_item = item;
                break;
              case 1:
                amount = income;
                const res = this.calculate(amount, gtgs_rate);
                tax = res.taxes;
                rate_k = res.k;
                rate_item = res.item;
                break;
              case 2:
                amount = income - (3500 * 12);
                const res2 = this.calculate(amount, gtgs_rate);
                tax = res2.taxes;
                rate_k = res2.k;
                rate_item = res2.item;
                break;
              case 3:
                amount = income > 4000 ? income * 0.8 : income - 800;
                tax = amount * 0.14;
                break;
              case 4:
              case 5:
                amount = income > 4000 ? income * 0.8 : income - 800;
                tax = amount * 0.2;
                break;
              case 6:
              case 7:
              case 8:
                amount = income;
                tax = amount * 0.2;
                break;
              default:
                break;
            }
            total = income - tax;
            break;
          default:
            break;
        }

        const data = { price1: amount, price2: rate_k * 100, price3: rate_item, price4: tax, price5: total };
        if (amount > 0) {
          this.setData({ isHidden: false, tax: data });
        }
        this.setData({ tax:data})
        console.log(data);
   //   })
   
  },
   calculate (amount, rates, amoutAvg)  {
    let taxes = 0, k = 0, item = 0;
    if (amount <= 0) {
      wx.showToast({
        title: '无需交税',
        icon: 'none',
        duration: 1000,
        position: 'top'
      })
     
    } else {
      for (let rate of rates) {
        const key = Object.keys(rate);
        const last = rates[rates.length - 1], lastKey = Object.keys(last);
        const flag = amoutAvg ? amoutAvg : amount;
        if (parseInt(flag) <= parseInt(key)) {
          taxes = amount * rate[key][1] - rate[key][0];
          k = rate[key][1]; item = rate[key][0];
          break;
        }
        if (parseInt(flag) > parseInt(lastKey)) {
          k = last[lastKey][1]; item = last[lastKey][0];
          taxes = amount * k - item;
          break;
        }
      }
    }
    return ({ taxes, k, item })
  },
   closeModal(){
     this.setData({ isHidden: true})
   },
   onChange(event) {
     const {value} = event.detail;
     console.log(value)
    
       wx.showToast({
         title: value ? '计算税后工资': '计算税前工资',
         icon: 'none',
         duration: 1000,
         position:'top'
       })
    
   }

})
