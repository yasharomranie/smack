package com.fullapp.yashar.samck.controler

import android.content.Intent
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.view.View
import com.fullapp.yashar.samck.R

class LoginActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)
    }


    fun login_to_app (view: View){


    }

    fun reg_to_app (view: View){
 var intent_reg= Intent(this, CreatuserActivity::class.java)
        startActivity(intent_reg)
    }
}
