#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function testAdminFeatures() {
  console.log("\n[Admin Tests] Starting admin features validation...\n");

  try {
    console.log("[1/5] Testing Deals CRUD...");
    const { data: dealsData, error: dealsError } = await supabase
      .from("deals")
      .select("*")
      .limit(5);

    if (dealsError) {
      throw new Error(`Deals fetch failed: ${dealsError.message}`);
    }
    console.log(`✓ Deals query successful (${dealsData?.length ?? 0} records)`);

    console.log("[2/5] Testing Coupon Requirements...");
    const { data: couponReqData, error: couponReqError } = await supabase
      .from("coupon_requirements")
      .select("*")
      .limit(5);

    if (couponReqError) {
      throw new Error(
        `Coupon requirements fetch failed: ${couponReqError.message}`
      );
    }
    console.log(
      `✓ Coupon requirements query successful (${couponReqData?.length ?? 0} records)`
    );

    console.log("[3/5] Testing Customer Coupon Claims...");
    const { data: claimsData, error: claimsError } = await supabase
      .from("customer_coupon_claims")
      .select("*")
      .limit(5);

    if (claimsError) {
      throw new Error(
        `Customer coupon claims fetch failed: ${claimsError.message}`
      );
    }
    console.log(
      `✓ Customer coupon claims query successful (${claimsData?.length ?? 0} records)`
    );

    console.log("[4/5] Testing Customer Profiles...");
    const { data: profilesData, error: profilesError } = await supabase
      .from("customer_profiles")
      .select("*")
      .limit(5);

    if (profilesError) {
      throw new Error(`Customer profiles fetch failed: ${profilesError.message}`);
    }
    console.log(
      `✓ Customer profiles query successful (${profilesData?.length ?? 0} records)`
    );

    console.log("[5/5] Testing Subcategories...");
    const { data: subCategoryData, error: subCategoryError } = await supabase
      .from("subcategories")
      .select("*")
      .limit(5);

    if (subCategoryError) {
      throw new Error(
        `Subcategories fetch failed: ${subCategoryError.message}`
      );
    }
    console.log(
      `✓ Subcategories query successful (${subCategoryData?.length ?? 0} records)`
    );

    console.log("\n✅ Admin Features Test PASSED\n");
    return true;
  } catch (error) {
    console.error("\n❌ Admin Features Test FAILED");
    console.error(error);
    return false;
  }
}

async function testCustomerFlows() {
  console.log("\n[Customer Flow Tests] Starting customer flow validation...\n");

  try {
    console.log("[1/4] Testing Customer Profile Creation...");
    const email = `test-customer-${Date.now()}@joox.com`;
    const { data: profileData, error: profileError } = await supabase
      .from("customer_profiles")
      .upsert({
        email,
        full_name: "Test Customer",
        phone: "+201001234567",
        city: "Cairo",
        address: "123 Main St",
        points: 100,
        score: 50,
        tier: "silver",
      })
      .select();

    if (profileError) {
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }
    console.log(`✓ Customer profile created: ${email}`);

    console.log("[2/4] Testing Coupon Claim Flow...");
    const { data: couponsData } = await supabase
      .from("coupons")
      .select("id")
      .eq("is_active", true)
      .limit(1);

    if (couponsData && couponsData.length > 0) {
      const couponId = couponsData[0].id;
      const { data: claimData, error: claimError } = await supabase
        .from("customer_coupon_claims")
        .insert({
          email,
          coupon_id: couponId,
        })
        .select();

      if (claimError) {
        throw new Error(`Coupon claim failed: ${claimError.message}`);
      }
      console.log(`✓ Coupon claimed successfully`);
    }

    console.log("[3/4] Testing Order Creation...");
    const { data: productsData } = await supabase
      .from("products")
      .select("id")
      .eq("is_active", true)
      .limit(1);

    if (productsData && productsData.length > 0) {
      const productId = productsData[0].id;
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: "Test Customer",
          customer_email: email,
          phone: "+201001234567",
          address: "123 Main St",
          city: "Cairo",
          payment_method: "cod",
          subtotal: 500,
          discount: 50,
          total: 450,
          items: JSON.stringify([{ id: productId, quantity: 1, price: 500 }]),
          status: "new",
        })
        .select();

      if (orderError) {
        throw new Error(`Order creation failed: ${orderError.message}`);
      }
      console.log(`✓ Order created successfully`);
    }

    console.log("[4/4] Testing Order Retrieval...");
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_email", email)
      .limit(5);

    if (ordersError) {
      throw new Error(`Order retrieval failed: ${ordersError.message}`);
    }
    console.log(`✓ Orders retrieved: ${ordersData?.length ?? 0} orders`);

    console.log("\n✅ Customer Flow Tests PASSED\n");
    return true;
  } catch (error) {
    console.error("\n❌ Customer Flow Tests FAILED");
    console.error(error);
    return false;
  }
}

async function runAll() {
  const adminResult = await testAdminFeatures();
  const customerResult = await testCustomerFlows();

  const allPassed = adminResult && customerResult;
  if (allPassed) {
    console.log("\n🎉 All E2E Tests PASSED!");
    process.exit(0);
  } else {
    console.log("\n⚠️ Some tests failed");
    process.exit(1);
  }
}

runAll().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
